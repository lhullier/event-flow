import React, { useState } from 'react';
import {  } from '@/api/Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { ArrowLeft, CheckCircle2, QrCode, User, Camera, Keyboard, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import QRScanner from '@/components/events/QRScanner';

export default function CheckIn() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [cpf, setCpf] = useState('');
  const [pendingParticipant, setPendingParticipant] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

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

  const checkInMutation = useMutation({
    mutationFn: async ({ type, value }) => {
      let participants;

      if (type === 'qr') {
        participants = await .entities.Participant.filter({
          event_id: eventId,
          qr_code: value,
        });
      } else {
        const cpfClean = value.replace(/\D/g, '');
        participants = await .entities.Participant.filter({
          event_id: eventId,
          cpf: cpfClean,
        });
      }

      if (participants.length === 0) {
        throw new Error('Participante não encontrado');
      }

      const participant = participants[0];

      // Verifica se já fez check-in hoje
      const today = new Date().toISOString().split('T')[0];
      const attendedSessions = participant.attended_sessions || [];

      if (attendedSessions.includes(today)) {
        throw new Error('Check-in já realizado hoje');
      }

      if (event?.is_paid && participant.payment_status !== 'pago' && participant.payment_status !== 'isento') {
        return { needsPayment: true, participant };
      }

      attendedSessions.push(today);

      const totalSessions = event?.total_sessions || 1;
      const sessionsCount = attendedSessions.length;
      const attendancePercentage = Math.round((sessionsCount / totalSessions) * 100);

      return .entities.Participant.update(participant.id, {
        check_in_status: true,
        check_in_date: new Date().toISOString(),
        attended_sessions: attendedSessions,
        sessions_attended_count: sessionsCount,
        attendance_percentage: attendancePercentage,
      });
    },
    onSuccess: (data) => {
      if (data?.needsPayment) {
        setPendingParticipant(data.participant);
        setError('');
      } else {
        queryClient.invalidateQueries({ queryKey: ['participants', eventId] });
        setSuccess(true);
        setError('');
        setCpf('');
        setPendingParticipant(null);
        
        setTimeout(() => {
          setSuccess(false);
          setShowManualInput(false);
        }, 3000);
      }
    },
    onError: (err) => {
      setError(err.message || 'Erro ao realizar check-in');
      setSuccess(false);
      setPendingParticipant(null);
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (participant) => {
      await .entities.Participant.update(participant.id, {
        payment_status: 'pago',
      });

      const today = new Date().toISOString().split('T')[0];
      const attendedSessions = participant.attended_sessions || [];
      
      if (!attendedSessions.includes(today)) {
        attendedSessions.push(today);
      }

      const totalSessions = event?.total_sessions || 1;
      const sessionsCount = attendedSessions.length;
      const attendancePercentage = Math.round((sessionsCount / totalSessions) * 100);

      return .entities.Participant.update(participant.id, {
        check_in_status: true,
        check_in_date: new Date().toISOString(),
        attended_sessions: attendedSessions,
        sessions_attended_count: sessionsCount,
        attendance_percentage: attendancePercentage,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants', eventId] });
      setSuccess(true);
      setPendingParticipant(null);
      setPaymentConfirmed(false);
      setCpf('');
      
      setTimeout(() => {
        setSuccess(false);
        setShowManualInput(false);
      }, 3000);
    },
  });

  const handleScanSuccess = (code) => {
    setShowScanner(false);
    setError('');
    checkInMutation.mutate({ type: 'qr', value: code });
  };

  const handleCpfCheckIn = (e) => {
    e.preventDefault();
    if (!cpf.trim()) return;
    
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      setError('CPF inválido. Deve conter 11 dígitos.');
      return;
    }

    setError('');
    checkInMutation.mutate({ type: 'cpf', value: cpf });
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
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Check-in de Participantes
            </h1>
            {event && (
              <p className="text-slate-600">Evento: {event.title}</p>
            )}
          </div>

          {pendingParticipant ? (
            <div className="py-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Pagamento Pendente
                </h2>
                <p className="text-slate-600">
                  {pendingParticipant.full_name}
                </p>
                <p className="text-sm text-slate-500">
                  CPF: {pendingParticipant.cpf}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="payment_confirmed"
                    checked={paymentConfirmed}
                    onCheckedChange={setPaymentConfirmed}
                  />
                  <Label htmlFor="payment_confirmed" className="text-sm leading-relaxed cursor-pointer">
                    Confirmo que o participante realizou o pagamento no local e assumo total responsabilidade pelo valor recebido (R$ {event?.price?.toFixed(2)}).
                  </Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPendingParticipant(null);
                    setPaymentConfirmed(false);
                    setCpf('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => confirmPaymentMutation.mutate(pendingParticipant)}
                  disabled={!paymentConfirmed || confirmPaymentMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {confirmPaymentMutation.isPending ? 'Confirmando...' : 'Confirmar e fazer check-in'}
                </Button>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Check-in realizado com sucesso
              </h2>
              <p className="text-lg text-green-600 font-medium">
                Presença registrada
              </p>
            </div>
          ) : showManualInput ? (
            <div className="py-6">
              <form onSubmit={handleCpfCheckIn} className="space-y-6">
                <div>
                  <Label htmlFor="cpf">CPF do Participante</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    maxLength={14}
                    className="text-lg"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowManualInput(false);
                      setCpf('');
                      setError('');
                    }}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={checkInMutation.isPending || !cpf.trim()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    {checkInMutation.isPending ? 'Verificando...' : 'Realizar Check-in'}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="py-12 space-y-4">
              <Button
                type="button"
                onClick={() => setShowScanner(true)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg py-6"
              >
                <Camera className="w-6 h-6 mr-3" />
                Escanear QR Code
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Ou</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setShowManualInput(true)}
                variant="outline"
                className="w-full text-lg py-6"
              >
                <Keyboard className="w-6 h-6 mr-3" />
                Check-in por CPF
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Como funciona o check-in?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Escaneie o QR Code ou digite o CPF do participante</li>
            <li>• O sistema verifica automaticamente o status do pagamento</li>
            <li>• A presença é registrada instantaneamente</li>
          </ul>
        </Card>
      </div>

      {showScanner && (
        <QRScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}