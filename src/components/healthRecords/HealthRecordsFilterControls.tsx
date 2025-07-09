import React from 'react';
import { Search, Calendar, X, ArrowUp, ArrowDown } from 'lucide-react';

interface HealthRecordsFilterControlsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterResident: string;
  setFilterResident: (value: string) => void;
  filterPeriod: '7' | '30' | '90' | 'all';
  setFilterPeriod: (value: '7' | '30' | '90' | 'all') => void;
  filterDate: string;
  setFilterDate: (value: string) => void;
  sortBy: 'date' | 'resident' | 'type' | 'severity';
  setSortBy: (value: 'date' | 'resident' | 'type' | 'severity') => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (value: 'asc' | 'desc') => void;
  recordsPerPage?: number;
  setRecordsPerPage?: (value: number) => void;
  residents: any[];
  showSortControls?: boolean;
  showPaginationControls?: boolean;
  recordType?: 'vital-signs' | 'elimination' | 'intercurrences';
}

export const HealthRecordsFilterControls: React.FC<HealthRecordsFilterControlsProps> = ({
  searchTerm,
  setSearchTerm,
  filterResident,
  setFilterResident,
  filterPeriod,
  setFilterPeriod,
  filterDate,
  setFilterDate,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  recordsPerPage,
  setRecordsPerPage,
  residents,
  showSortControls = true,
  showPaginationControls = true,
  recordType
}) => {
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSortChange = (field: 'date' | 'resident' | 'type' | 'severity') => {
    if (sortBy === field) {
      toggleSortDirection();
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por residente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filterResident}
            onChange={(e) => setFilterResident(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Residentes</option>
            {residents.map(resident => (
              <option key={resident.id} value={resident.id}>
                {resident.name}
              </option>
            ))}
          </select>
          <select
            value={filterPeriod}
            onChange={(e) => {
              setFilterPeriod(e.target.value as any);
              if (e.target.value !== 'all') {
                setFilterDate(''); // Clear specific date when period is selected
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!!filterDate}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="all">Todos os períodos</option>
          </select>
          <div className="flex items-center space-x-2">
            <Calendar className="text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                if (e.target.value) {
                  setFilterPeriod('all'); // Clear period filter when specific date is selected
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                title="Limpar data"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showSortControls && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Ordenar por:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSortChange('date')}
                className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 ${
                  sortBy === 'date' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>Data</span>
                {sortBy === 'date' && (
                  sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSortChange('resident')}
                className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 ${
                  sortBy === 'resident' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>Residente</span>
                {sortBy === 'resident' && (
                  sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                )}
              </button>
              
              {/* Only show Type button for elimination and intercurrences */}
              {recordType !== 'vital-signs' && (
                <button
                  onClick={() => handleSortChange('type')}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 ${
                    sortBy === 'type' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>Tipo</span>
                  {sortBy === 'type' && (
                    sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                  )}
                </button>
              )}
              
              {recordType === 'intercurrences' && (
                <button
                  onClick={() => handleSortChange('severity')}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 ${
                    sortBy === 'severity' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>Severidade</span>
                  {sortBy === 'severity' && (
                    sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          {showPaginationControls && setRecordsPerPage && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Registros por página:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
