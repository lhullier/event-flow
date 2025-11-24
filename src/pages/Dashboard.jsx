import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import EventCard from '@/components/events/EventCard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'user')) {
          alert('Acesso negado. Apenas organizadores podem acessar o sistema.');
          base44.auth.redirectToLogin();
          return;
        }
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const allEvents = await base44.entities.Event.list('-created_date');
      const allParticipants = await base44.entities.Participant.list();
      
      // Conta participantes por evento
      const eventsWithCount = allEvents.map(event => ({
        ...event,
        registered_count: allParticipants.filter(p => p.event_id === event.id).length
      }));
      
      // Admin vê todos, Organizador vê apenas os seus
      if (user?.role === 'admin') {
        return eventsWithCount;
      } else {
        return eventsWithCount.filter(e => e.organizer_id === user?.id);
      }
    },
    enabled: !!user,
  });

  const today = new Date().toISOString().split('T')[0];
  
  const activeEvents = events.filter(e => {
    if (e.status !== 'ativo') return false;
    
    // Verifica se o evento já passou
    if (e.is_periodic && e.periodic_dates?.length > 0) {
      const lastDate = e.periodic_dates[e.periodic_dates.length - 1];
      return lastDate >= today;
    } else {
      return e.date >= today;
    }
  });
  
  const draftEvents = events.filter(e => e.status === 'rascunho');
  
  const pastEvents = events.filter(e => {
    if (e.status === 'encerrado') return true;
    
    // Eventos ativos que já passaram
    if (e.status === 'ativo') {
      if (e.is_periodic && e.periodic_dates?.length > 0) {
        const lastDate = e.periodic_dates[e.periodic_dates.length - 1];
        return lastDate < today;
      } else {
        return e.date < today;
      }
    }
    
    return false;
  });

  const filteredActiveEvents = activeEvents.filter(e =>
    e.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDraftEvents = draftEvents.filter(e =>
    e.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPastEvents = pastEvents.filter(e =>
    e.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Search Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Input
            type="search"
            placeholder="Procurar eventos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Draft Events */}
        {filteredDraftEvents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Rascunhos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDraftEvents.map(event => (
                <EventCard key={event.id} event={event} isDraft />
              ))}
            </div>
          </div>
        )}

        {/* Active Events */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Eventos ativos
          </h2>
          {filteredActiveEvents.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum evento ativo no momento</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActiveEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Past Events */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Eventos anteriores
          </h2>
          {filteredPastEvents.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum evento anterior</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPastEvents.map(event => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}