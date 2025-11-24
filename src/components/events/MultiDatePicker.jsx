import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MultiDatePicker({ selectedDates = [], onChange }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const toggleDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isSelected = selectedDates.includes(dateStr);
    
    if (isSelected) {
      onChange(selectedDates.filter(d => d !== dateStr));
    } else {
      onChange([...selectedDates, dateStr].sort());
    }
  };

  const isDateSelected = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedDates.includes(dateStr);
  };

  const removeDate = (dateStr) => {
    onChange(selectedDates.filter(d => d !== dateStr));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="flex gap-4 w-full">
      <Card className="p-3 flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-sm font-semibold text-slate-900">
            {format(currentMonth, 'MMMM/yyyy', { locale: ptBR })}
          </h3>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week days header */}
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
            <div key={idx} className="text-center text-xs font-medium text-slate-500 py-1 w-8">
              {day}
            </div>
          ))}
          
          {/* Empty days */}
          {emptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} className="w-8" />
          ))}
          
          {/* Days */}
          {daysInMonth.map((day) => {
            const isSelected = isDateSelected(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => toggleDate(day)}
                className={`
                  w-8 h-8 text-xs rounded transition-all
                  ${isSelected 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 font-bold' 
                    : 'hover:bg-slate-100 text-slate-600'
                  }
                  ${isToday && !isSelected ? 'ring-1 ring-indigo-600' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected dates list */}
      {selectedDates.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              {selectedDates.length} {selectedDates.length === 1 ? 'data selecionada' : 'datas selecionadas'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-red-600 hover:text-red-700 h-7 text-xs px-2"
            >
              Limpar todas
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-1">
            {selectedDates.map((dateStr) => (
              <div
                key={dateStr}
                className="flex items-center justify-between bg-white px-3 py-1.5 rounded text-sm"
              >
                <span className="text-slate-700">
                  {format(parseISO(dateStr), "dd/MM/yyyy")}
                </span>
                <button
                  type="button"
                  onClick={() => removeDate(dateStr)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}