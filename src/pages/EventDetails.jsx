import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users, DollarSign, Edit, QrCode, Link as LinkIcon, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ParticipantsList from '@/components/events/ParticipantsList';

export default function EventDetails() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'user')) {
          alert('Acesso negado. Apenas organizadores podem visualizar detalhes de eventos.');
          navigate(createPageUrl('Dashboard'));
          return;
        }
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, [navigate]);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['participants', eventId],
    queryFn: () => base44.entities.Participant.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isOrganizer = user?.role === 'admin' || event.organizer_id === user?.id;
  
  const inviteLink = `${window.location.origin}${createPageUrl('ParticipantRegistration')}?eventId=${event.id}`;
  
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Link de convite copiado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            {event.image_url && (
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-80 object-cover"
                />
              </div>
            )}

            {/* Event Info Card */}
            <Card className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {event.title}
                  </h1>
                  {event.organizer_name && (
                    <p className="text-slate-600">
                      Organizador: <span className="font-medium">{event.organizer_name}</span>
                    </p>
                  )}
                </div>
                {isOrganizer && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl('CreateEvent') + `?id=${event.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar evento
                  </Button>
                )}
              </div>

              {/* Event Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 text-slate-700">
                  <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    {event.is_periodic && event.periodic_dates?.length > 0 ? (
                      <div>
                        <span className="font-medium block mb-2">Evento periódico - {event.total_sessions} encontros:</span>
                        <div className="space-y-1">
                          {event.periodic_dates.map((date, idx) => (
                            <div key={idx} className="text-sm">
                              • {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>{event.start_time} - {event.end_time}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <span>{event.location}</span>
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  Descrição do evento
                </h2>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Informação de ingresso
              </h3>
              
              <div className="space-y-4">
                {event.is_paid ? (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Valor do Ingresso:</span>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {event.price?.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                      Gratuito
                    </Badge>
                  </div>
                )}

                {event.registration_limit && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-slate-600">Inscritos:</span>
                    <span className="font-semibold text-slate-900">
                      {participants.length} / {event.registration_limit}
                    </span>
                  </div>
                )}

                {event.has_certificate && (
                  <div className="border-t pt-4">
                    <Badge className="bg-indigo-100 text-indigo-800">
                      Certificado disponível ({event.certificate_hours}h)
                    </Badge>
                  </div>
                )}
              </div>

              {!isOrganizer && event.status === 'ativo' && (
                <Button
                  className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  onClick={() => navigate(createPageUrl('ParticipantRegistration') + `?eventId=${event.id}`)}
                >
                  Inscrever-se
                </Button>
              )}

              {isOrganizer && (
                <div className="space-y-3 mt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={copyInviteLink}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Copiar link de convite
                  </Button>
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => navigate(createPageUrl('ManualRegistration') + `?eventId=${event.id}`)}
                  >
                    + Cadastro manual
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(createPageUrl('CheckIn') + `?eventId=${event.id}`)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Ler QR code
                  </Button>
                </div>
              )}
            </Card>

            {/* Event Type Badge */}
            <Card className="p-6">
              <Badge variant="outline" className="text-sm">
                Evento {event.event_type}
              </Badge>
            </Card>
          </div>
        </div>

        {/* Participants List (only for organizers) */}
        {isOrganizer && (
          <div className="mt-8">
            <ParticipantsList participants={participants} eventId={event.id} event={event} />
          </div>
        )}
      </div>
    </div>
  );
}