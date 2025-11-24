import React, { useState, useEffect } from 'react';
import {  } from '@/api/Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ManualRegistration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    cpf: '',
    full_name: '',
    email: '',
    payment_confirmed: false,
  });

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await .entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['participants', eventId],
    queryFn: () => .entities.Participant.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const qrCode = `${eventId}-${data.cpf}-${Date.now()}`;
      
      // Generate registration number
      const timestamp = Date.now().toString();
      const regNumber = `${event.title.substring(0, 3).toUpperCase()}-${timestamp.substring(timestamp.length - 6)}`;
      
      return .entities.Participant.create({
        event_id: eventId,
        registration_number: regNumber,
        cpf: data.cpf,
        full_name: data.full_name,
        email: data.email,
        qr_code: qrCode,
        payment_status: (event?.is_paid && data.payment_confirmed) ? 'pago' : (event?.is_paid ? 'pendente' : 'isento'),
        payment_method: 'no_local',
        check_in_status: false,
        attendance_percentage: 0,
        certificate_issued: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', eventId] });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        navigate(createPageUrl('EventDetails') + `?id=${eventId}`);
      }, 2000);
    },
    onError: (err) => {
      setError(err.message || 'Erro ao cadastrar participante');
      setSuccess(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate CPF format (basic)
    const cpfClean = formData.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      setError('CPF inválido. Deve conter 11 dígitos.');
      return;
    }

    // Check if CPF already exists for this event
    const cpfExists = participants.some(p => p.cpf === cpfClean);
    if (cpfExists) {
      setError('Este CPF já está cadastrado neste evento.');
      return;
    }

    registerMutation.mutate({
      ...formData,
      cpf: cpfClean,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('EventDetails') + `?id=${eventId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Inscrição manual de participante
            </h1>
            {event && (
              <p className="text-slate-600">Evento: {event.title}</p>
            )}
          </div>

          {success ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Inscrito com sucesso!
              </h2>
              <p className="text-slate-600">
                Redirecionando...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="full_name">Nome completo *</Label>
                <Input
                  id="full_name"
                  placeholder="Insira seu nome completo"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  required
                  maxLength={14}
                />
                <p className="text-xs text-slate-500 mt-1">
                  O CPF não pode repetir para o mesmo evento
                </p>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Insira e-mail para receber certificado"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {event?.is_paid && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="payment_confirmed"
                      checked={formData.payment_confirmed}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, payment_confirmed: checked })
                      }
                    />
                    <Label htmlFor="payment_confirmed" className="text-sm leading-relaxed cursor-pointer">
                      Confirmo que o participante realizou o pagamento no local e assumo total responsabilidade pelo valor recebido.
                    </Label>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {registerMutation.isPending ? 'Salvando...' : 'Salvar ingresso'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}