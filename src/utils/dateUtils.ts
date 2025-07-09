export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export const formatCurrency = (value: string): string => {
  // Remove todos os caracteres não numéricos
  const numericValue = value.replace(/\D/g, '');
  
  // Converte para número e divide por 100 para obter o valor em reais
  const floatValue = parseInt(numericValue || '0') / 100;
  
  // Formata o valor como moeda brasileira
  return floatValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const currencyToNumber = (formattedValue: string): number => {
  // Remove o símbolo da moeda e outros caracteres não numéricos, mantendo o ponto decimal
  const numericString = formattedValue.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericString || '0');
};
