import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EventCard({ event, isPast = false, isDraft = false }) {
  const eventDate = new Date(event.date);
  const month = format(eventDate, 'MMM', { locale: ptBR }).toUpperCase();
  const day = format(eventDate, 'dd');

  return (
    <Link to={createPageUrl('EventDetails') + `?id=${event.id}`}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group">
        {/* Event Image */}
        <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-white opacity-50" />
            </div>
          )}
          
          {/* Date Badge */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-center">
            <div className="text-xs font-bold text-indigo-600">{month}</div>
            <div className="text-2xl font-bold text-slate-900">{day}</div>
            {event.is_periodic && event.total_sessions && (
              <div className="text-[10px] text-slate-500 mt-1">{event.total_sessions} encontros</div>
            )}
          </div>

          {/* Status Badge */}
          {isPast && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-slate-900 text-white">Encerrado</Badge>
            </div>
          )}
          {isDraft && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-yellow-500 text-white">Rascunho</Badge>
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {event.title}
          </h3>

          <div className="space-y-2 text-sm text-slate-600">
            {event.is_periodic && event.periodic_dates?.length > 0 ? (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                <span>
                  {format(new Date(event.periodic_dates[0]), "dd/MM/yyyy", { locale: ptBR })} até{' '}
                  {format(new Date(event.periodic_dates[event.periodic_dates.length - 1]), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{format(eventDate, "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{event.start_time} - {event.end_time}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {event.is_paid ? (
                <>
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">
                    R$ {event.price?.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-indigo-600">
                  Gratuito
                </span>
              )}
            </div>

            {event.registration_limit && (
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <Users className="w-4 h-4" />
                <span>Inscritos {event.registered_count || 0}/{event.registration_limit}</span>
              </div>
            )}
          </div>

          {/* Organizer */}
          {event.organizer_name && (
            <div className="mt-3 text-xs text-slate-500">
              Organizador: {event.organizer_name}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}