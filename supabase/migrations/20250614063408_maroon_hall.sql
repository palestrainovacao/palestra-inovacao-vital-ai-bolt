/*
  # Create notifications table for AI-powered health monitoring

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text, notification type: critical, warning, info, success)
      - `category` (text, notification category: health, financial, family, medication, schedule, system)
      - `title` (text, notification title)
      - `message` (text, notification message)
      - `timestamp` (timestamptz, when notification was created)
      - `read` (boolean, whether notification has been read)
      - `action_url` (text, optional URL for action)
      - `resident_id` (uuid, optional reference to resident)
      - `resident_name` (text, optional resident name for quick access)
      - `priority` (text, priority level: high, medium, low)
      - `source` (text, notification source: system, ai, manual)
      - `metadata` (jsonb, additional data for AI analysis)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)

  2. Security
    - Enable RLS on notifications table
    - Add policies for authenticated users to manage their own notifications
    - Add indexes for performance optimization

  3. Constraints
    - Check constraints for valid enum values
    - Foreign key constraints for data integrity
    - Triggers for automatic timestamp updates
*/

-- Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('critical', 'warning', 'info', 'success')),
    category text NOT NULL CHECK (category IN ('health', 'financial', 'family', 'medication', 'schedule', 'system', 'ai')),
    title text NOT NULL,
    message text NOT NULL,
    timestamp timestamptz NOT NULL DEFAULT now(),
    read boolean DEFAULT false,
    action_url text,
    resident_id uuid REFERENCES public.residents(id) ON DELETE SET NULL,
    resident_name text,
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    source text DEFAULT 'system' CHECK (source IN ('system', 'ai', 'manual')),
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON public.notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_resident_id ON public.notifications(resident_id);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON public.notifications(source);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_timestamp ON public.notifications(user_id, read, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_category_read ON public.notifications(user_id, category, read);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications table

-- Users can insert their own notifications
CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own notifications (mainly for marking as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create a trigger to update the 'updated_at' column on each update
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically clean up old notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND read = true;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate AI health alerts based on vital signs patterns
CREATE OR REPLACE FUNCTION generate_ai_health_alerts()
RETURNS void AS $$
DECLARE
  resident_record RECORD;
  recent_vitals RECORD;
  alert_message text;
  alert_title text;
  alert_priority text;
BEGIN
  -- Loop through all residents to check for health patterns
  FOR resident_record IN 
    SELECT DISTINCT r.id, r.name, r.user_id, r.health_status
    FROM public.residents r
    WHERE r.health_status IN ('attention', 'critical')
  LOOP
    -- Check for concerning vital signs patterns in the last 7 days
    SELECT 
      AVG(systolic_pressure) as avg_systolic,
      AVG(diastolic_pressure) as avg_diastolic,
      AVG(oxygen_saturation) as avg_oxygen,
      AVG(glucose) as avg_glucose,
      AVG(heart_rate) as avg_heart_rate,
      AVG(temperature) as avg_temperature,
      COUNT(*) as reading_count
    INTO recent_vitals
    FROM public.vital_signs vs
    WHERE vs.resident_id = resident_record.id
    AND vs.recorded_at >= NOW() - INTERVAL '7 days';

    -- Generate alerts based on patterns
    IF recent_vitals.reading_count >= 3 THEN
      -- High blood pressure pattern
      IF recent_vitals.avg_systolic > 160 OR recent_vitals.avg_diastolic > 100 THEN
        alert_title := 'Padrão de Hipertensão Detectado';
        alert_message := format('IA detectou pressão arterial consistentemente elevada em %s. Média: %s/%s mmHg. Recomenda-se avaliação cardiológica.',
          resident_record.name, 
          ROUND(recent_vitals.avg_systolic), 
          ROUND(recent_vitals.avg_diastolic));
        alert_priority := 'high';
        
        -- Insert notification if not already exists for this resident in the last 24 hours
        INSERT INTO public.notifications (
          user_id, type, category, title, message, priority, source, 
          resident_id, resident_name, metadata
        )
        SELECT 
          resident_record.user_id, 'warning', 'ai', alert_title, alert_message, alert_priority, 'ai',
          resident_record.id, resident_record.name,
          jsonb_build_object(
            'avg_systolic', ROUND(recent_vitals.avg_systolic),
            'avg_diastolic', ROUND(recent_vitals.avg_diastolic),
            'reading_count', recent_vitals.reading_count,
            'analysis_period', '7_days'
          )
        WHERE NOT EXISTS (
          SELECT 1 FROM public.notifications 
          WHERE user_id = resident_record.user_id 
          AND resident_id = resident_record.id 
          AND category = 'ai'
          AND title = alert_title
          AND created_at >= NOW() - INTERVAL '24 hours'
        );
      END IF;

      -- Low oxygen saturation pattern
      IF recent_vitals.avg_oxygen < 92 THEN
        alert_title := 'Baixa Saturação de Oxigênio';
        alert_message := format('IA detectou saturação de oxigênio baixa em %s. Média: %s%%. Monitoramento respiratório urgente necessário.',
          resident_record.name, 
          ROUND(recent_vitals.avg_oxygen, 1));
        alert_priority := 'critical';
        
        INSERT INTO public.notifications (
          user_id, type, category, title, message, priority, source, 
          resident_id, resident_name, metadata
        )
        SELECT 
          resident_record.user_id, 'critical', 'ai', alert_title, alert_message, alert_priority, 'ai',
          resident_record.id, resident_record.name,
          jsonb_build_object(
            'avg_oxygen', ROUND(recent_vitals.avg_oxygen, 1),
            'reading_count', recent_vitals.reading_count,
            'analysis_period', '7_days'
          )
        WHERE NOT EXISTS (
          SELECT 1 FROM public.notifications 
          WHERE user_id = resident_record.user_id 
          AND resident_id = resident_record.id 
          AND category = 'ai'
          AND title = alert_title
          AND created_at >= NOW() - INTERVAL '12 hours'
        );
      END IF;

      -- High glucose pattern (diabetes concern)
      IF recent_vitals.avg_glucose > 200 THEN
        alert_title := 'Glicemia Elevada Persistente';
        alert_message := format('IA detectou glicemia consistentemente alta em %s. Média: %s mg/dL. Ajuste na medicação pode ser necessário.',
          resident_record.name, 
          ROUND(recent_vitals.avg_glucose));
        alert_priority := 'high';
        
        INSERT INTO public.notifications (
          user_id, type, category, title, message, priority, source, 
          resident_id, resident_name, metadata
        )
        SELECT 
          resident_record.user_id, 'warning', 'ai', alert_title, alert_message, alert_priority, 'ai',
          resident_record.id, resident_record.name,
          jsonb_build_object(
            'avg_glucose', ROUND(recent_vitals.avg_glucose),
            'reading_count', recent_vitals.reading_count,
            'analysis_period', '7_days'
          )
        WHERE NOT EXISTS (
          SELECT 1 FROM public.notifications 
          WHERE user_id = resident_record.user_id 
          AND resident_id = resident_record.id 
          AND category = 'ai'
          AND title = alert_title
          AND created_at >= NOW() - INTERVAL '24 hours'
        );
      END IF;

      -- Fever pattern
      IF recent_vitals.avg_temperature > 37.8 THEN
        alert_title := 'Padrão Febril Detectado';
        alert_message := format('IA detectou temperatura elevada persistente em %s. Média: %s°C. Investigação médica recomendada.',
          resident_record.name, 
          ROUND(recent_vitals.avg_temperature, 1));
        alert_priority := 'high';
        
        INSERT INTO public.notifications (
          user_id, type, category, title, message, priority, source, 
          resident_id, resident_name, metadata
        )
        SELECT 
          resident_record.user_id, 'warning', 'ai', alert_title, alert_message, alert_priority, 'ai',
          resident_record.id, resident_record.name,
          jsonb_build_object(
            'avg_temperature', ROUND(recent_vitals.avg_temperature, 1),
            'reading_count', recent_vitals.reading_count,
            'analysis_period', '7_days'
          )
        WHERE NOT EXISTS (
          SELECT 1 FROM public.notifications 
          WHERE user_id = resident_record.user_id 
          AND resident_id = resident_record.id 
          AND category = 'ai'
          AND title = alert_title
          AND created_at >= NOW() - INTERVAL '24 hours'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to analyze intercurrence patterns
CREATE OR REPLACE FUNCTION analyze_intercurrence_patterns()
RETURNS void AS $$
DECLARE
  resident_record RECORD;
  intercurrence_count integer;
  alert_message text;
  alert_title text;
BEGIN
  -- Check for residents with multiple intercurrences in the last 7 days
  FOR resident_record IN 
    SELECT r.id, r.name, r.user_id, COUNT(i.id) as intercurrence_count
    FROM public.residents r
    LEFT JOIN public.intercurrences i ON r.id = i.resident_id 
    WHERE i.occurred_at >= NOW() - INTERVAL '7 days'
    GROUP BY r.id, r.name, r.user_id
    HAVING COUNT(i.id) >= 3
  LOOP
    alert_title := 'Padrão de Intercorrências Frequentes';
    alert_message := format('IA detectou %s intercorrências em %s nos últimos 7 dias. Avaliação médica detalhada recomendada.',
      resident_record.intercurrence_count,
      resident_record.name);
    
    INSERT INTO public.notifications (
      user_id, type, category, title, message, priority, source, 
      resident_id, resident_name, metadata
    )
    SELECT 
      resident_record.user_id, 'warning', 'ai', alert_title, alert_message, 'high', 'ai',
      resident_record.id, resident_record.name,
      jsonb_build_object(
        'intercurrence_count', resident_record.intercurrence_count,
        'analysis_period', '7_days',
        'pattern_type', 'frequent_intercurrences'
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE user_id = resident_record.user_id 
      AND resident_id = resident_record.id 
      AND category = 'ai'
      AND title = alert_title
      AND created_at >= NOW() - INTERVAL '24 hours'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE read = false) as unread_notifications,
  COUNT(*) FILTER (WHERE type = 'critical') as critical_notifications,
  COUNT(*) FILTER (WHERE source = 'ai') as ai_notifications,
  COUNT(*) FILTER (WHERE category = 'health') as health_notifications,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as notifications_24h
FROM public.notifications
GROUP BY user_id;
