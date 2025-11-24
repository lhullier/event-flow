import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Copy, XCircle, Calendar, MapPin, Clock, User, Ticket, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ParticipantRegistration() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

  const [step, setStep] = useState(1); // 1: info + form, 2: success
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const qrCanvasRef = useRef(null);
  const [formData, setFormData] = useState({
    cpf: '',
    full_name: '',
    email: '',
    payment_proof_url: '',
    accept_responsibility: false,
    payment_method: 'antecipado',
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

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const qrCode = `${eventId}-${data.cpf}-${Date.now()}`;
      
      // Generate registration number
      const timestamp = Date.now().toString();
      const regNumber = `${event.title.substring(0, 3).toUpperCase()}-${timestamp.substring(timestamp.length - 6)}`;
      
      const participant = await base44.entities.Participant.create({
        event_id: eventId,
        registration_number: regNumber,
        cpf: data.cpf,
        full_name: data.full_name,
        email: data.email,
        qr_code: qrCode,
        payment_status: event?.is_paid ? 'pendente' : 'isento',
        payment_method: data.payment_method,
        payment_proof_url: data.payment_proof_url || '',
        check_in_status: false,
        attendance_percentage: 0,
        certificate_issued: false,
      });

      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrCode)}`;
      setQrCodeUrl(qrImageUrl);
      setParticipantName(data.full_name);
      setRegistrationNumber(regNumber);

      return participant;
    },
    onSuccess: () => {
      setError('');
      setStep(2);
    },
    onError: (err) => {
      setError(err.message || 'Erro ao realizar inscrição');
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, payment_proof_url: file_url });
    } catch (err) {
      setError('Erro ao fazer upload do comprovante');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (event.registration_limit && participants.length >= event.registration_limit) {
      setError('Evento já atingiu o limite de inscrições.');
      return;
    }
    
    const cpfClean = formData.cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      setError('CPF inválido. Deve conter 11 dígitos.');
      return;
    }

    const cpfExists = participants.some(p => p.cpf === cpfClean);
    if (cpfExists) {
      setError('Este CPF já está cadastrado neste evento.');
      return;
    }

    if (event?.is_paid) {
      if (!formData.accept_responsibility) {
        setError('Você deve aceitar a responsabilidade pelo pagamento');
        return;
      }
      if (formData.payment_method === 'antecipado' && !formData.payment_proof_url) {
        setError('É necessário enviar o comprovante de pagamento');
        return;
      }
    }

    registerMutation.mutate({
      ...formData,
      cpf: cpfClean,
    });
  };

  const copyPixCode = () => {
    if (event?.pix_code) {
      navigator.clipboard.writeText(event.pix_code);
      alert('Código PIX copiado!');
    }
  };

  const downloadQRCode = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Canvas size
      canvas.width = 600;
      canvas.height = 700;
      
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Load QR code image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = qrCodeUrl;
      });
      
      // Draw QR code centered
      const qrSize = 400;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 80;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      
      // Event title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(event.title, canvas.width / 2, 50);
      
      // Participant name
      ctx.fillStyle = '#475569';
      ctx.font = '20px Arial';
      ctx.fillText(participantName, canvas.width / 2, 520);
      
      // Instructions
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Arial';
      ctx.fillText('Apresente este QR Code no evento', canvas.width / 2, 560);
      
      if (event.is_periodic) {
        ctx.fillText('Válido para todos os encontros', canvas.width / 2, 590);
      }
      
      // Date
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Arial';
      if (event.is_periodic && event.periodic_dates?.length > 0) {
        ctx.fillText(
          `${format(new Date(event.periodic_dates[0]), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(event.periodic_dates[event.periodic_dates.length - 1]), 'dd/MM/yyyy', { locale: ptBR })}`,
          canvas.width / 2,
          640
        );
      } else {
        ctx.fillText(format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR }), canvas.width / 2, 640);
      }
      
      // Download
      const link = document.createElement('a');
      link.download = `qrcode-${event.title.replace(/\s+/g, '-')}-${participantName.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Erro ao baixar QR Code. Tente fazer uma captura de tela.');
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const isEventFull = event.registration_limit && participants.length >= event.registration_limit;
  const eventDate = new Date(event.date);

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-6">
        <Card className="max-w-md w-full p-12 text-center shadow-xl">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-900 mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Inscrito com sucesso!
          </h2>
          <p className="text-slate-600 mb-2">{participantName}</p>
          {registrationNumber && (
            <div className="inline-block bg-indigo-100 text-indigo-900 px-4 py-2 rounded-lg mb-8">
              <p className="text-sm font-medium">Número de inscrição</p>
              <p className="text-xl font-bold">{registrationNumber}</p>
            </div>
          )}

          {qrCodeUrl && (
            <div className="mb-6">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="mx-auto border-4 border-slate-200 rounded-lg"
              />
              <p className="text-sm text-slate-500 mt-4 mb-4">
                {event.is_periodic 
                  ? 'Use este QR Code em todos os encontros do evento.'
                  : 'Apresente este QR Code no evento.'}
              </p>
              <Button
                onClick={downloadQRCode}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar QR Code
              </Button>
            </div>
          )}

          {event.is_paid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <p className="text-sm text-yellow-800">
                Seu pagamento está em análise. Você receberá uma confirmação por e-mail.
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (isEventFull) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-6">
        <Card className="max-w-md w-full p-12 text-center shadow-xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Evento lotado
          </h2>
          <p className="text-slate-600">
            Este evento atingiu o limite máximo de {event.registration_limit} inscritos.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Event Image */}
        {event.image_url && (
          <div className="w-full h-80 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="px-6 py-12 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Event Info */}
            <div className="space-y-8">
              <h1 className="text-4xl font-bold text-slate-900">
                {event.title}
              </h1>

              {/* Data e Hora */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">Data e Hora</h2>
                <div className="space-y-2 text-slate-700">
                  {event.is_periodic && event.periodic_dates?.length > 0 ? (
                    <>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-1" />
                        <div>
                          <div className="font-medium mb-1">Evento periódico - {event.total_sessions} encontros:</div>
                          <div className="space-y-1 text-sm">
                            {event.periodic_dates.map((date, idx) => (
                              <div key={idx}>• {format(new Date(date), "dd/MM/yyyy", { locale: ptBR })}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(eventDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Local */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-3">Local</h2>
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 mt-1" />
                  <span>{event.location}</span>
                </div>
              </div>

              {/* Organizador */}
              {event.organizer_name && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Organizador</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-500" />
                    </div>
                    <span className="text-slate-700">{event.organizer_name}</span>
                  </div>
                </div>
              )}

              {/* Descrição */}
              {event.description && (
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">Descrição do evento</h2>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Registration Form */}
            <div>
              <Card className="p-8 shadow-lg border-2 border-slate-100 sticky top-8">
                {/* Ticket Info */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Informação de ingresso
                  </h3>
                  {event.is_paid ? (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Ticket className="w-5 h-5" />
                      <span className="font-semibold">Valor do Ingresso: R$ {event.price?.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="text-green-600 font-semibold">Gratuito</div>
                  )}
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="full_name">Nome completo *</Label>
                    <Input
                      id="full_name"
                      placeholder="Insira seu nome completo"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="mt-1"
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
                      className="mt-1"
                    />
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
                      className="mt-1"
                    />
                  </div>

                  {event.is_paid && (
                    <>
                      <div>
                        <Label>Pagamento *</Label>
                        <Select
                          value={formData.payment_method}
                          onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="antecipado">Pagamento antecipado</SelectItem>
                            <SelectItem value="no_local">Pagamento no local do evento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.payment_method === 'antecipado' && (
                        <>
                          {event.pix_code && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={copyPixCode}
                              className="w-full bg-indigo-900 text-white hover:bg-indigo-800"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar código de pagamento
                            </Button>
                          )}

                          <div>
                            <Label htmlFor="payment_proof">Comprovante *</Label>
                            <Input
                              id="payment_proof"
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={uploading}
                              className="mt-1"
                            />
                            {formData.payment_proof_url && (
                              <p className="text-xs text-green-600 mt-1">✓ Comprovante enviado</p>
                            )}
                          </div>
                        </>
                      )}

                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="accept"
                          checked={formData.accept_responsibility}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, accept_responsibility: checked })
                          }
                        />
                        <Label htmlFor="accept" className="text-xs leading-relaxed cursor-pointer text-slate-600">
                          Assumo total responsabilidade pelo pagamento integral dos valores devidos referentes à inscrição.
                        </Label>
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending || uploading}
                    className="w-full bg-indigo-900 hover:bg-indigo-800 text-white h-12 text-base font-semibold"
                  >
                    {registerMutation.isPending ? 'Processando...' : 'Inscrever-se'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}