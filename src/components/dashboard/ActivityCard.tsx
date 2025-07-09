import React from 'react';
import { Clock } from 'lucide-react';

interface Activity {
  id: string;
  type: 'medication' | 'emergency' | 'family' | 'schedule';
  title: string;
  description: string;
  time: string;
  priority: 'low' | 'medium' | 'high';
}

interface ActivityCardProps {
  activities: Activity[];
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

const typeColors = {
  medication: 'bg-purple-500',
  emergency: 'bg-red-500',
  family: 'bg-pink-500',
  schedule: 'bg-blue-500'
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activities }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`w-2 h-2 rounded-full mt-2 ${typeColors[activity.type]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[activity.priority]}`}>
                  {activity.priority === 'high' ? 'Alta' : 
                   activity.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
      
      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhuma atividade recente</p>
        </div>
      )}
    </div>
  );
};
