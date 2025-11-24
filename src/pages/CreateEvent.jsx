import React, { useState, useEffect } from 'react';
import {  } from '@/api/Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import MultiDatePicker from '../components/events/MultiDatePicker';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CreateEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const isEditing = !!eventId;
  
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    event_type: 'presencial',
    is_paid: false,
    price: 0,
    pix_code: '',
    registration_limit: null,
    has_certificate: false,
    certificate_hours: 0,
    image_url: '',
    status: 'ativo',
    is_periodic: false,
    periodic_dates: [],
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await .auth.me();
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'user')) {
          alert('Acesso negado. Apenas organizadores podem criar eventos.');
          navigate(createPageUrl('Dashboard'));
          return;
        }
        setUser(currentUser);
      } catch (err) {
        .auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: existingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await .entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: isEditing && !!eventId,
  });

  useEffect(() => {
    if (existingEvent && isEditing) {
        setFormData({
          title: existingEvent.title || '',
          description: existingEvent.description || '',
          date: existingEvent.date || '',
          start_time: existingEvent.start_time || '',
          end_time: existingEvent.end_time || '',
          location: existingEvent.location || '',
          event_type: existingEvent.event_type || 'presencial',
          is_paid: existingEvent.is_paid || false,
          price: existingEvent.price || 0,
          pix_code: existingEvent.pix_code || '',
          registration_limit: existingEvent.registration_limit || '',
          has_certificate: existingEvent.has_certificate || false,
          certificate_hours: existingEvent.certificate_hours || '',
          image_url: existingEvent.image_url || '',
          is_periodic: existingEvent.is_periodic || false,
          periodic_dates: existingEvent.periodic_dates || [],
        });
      }
  }, [existingEvent, isEditing]);

  const saveEventMutation = useMutation({
    mutationFn: ({ eventData, publish }) => {
      const dataToSave = {
        ...eventData,
        status: publish ? 'ativo' : 'rascunho',
      };
      
      if (isEditing) {
        return .entities.Event.update(eventId, dataToSave);
      } else {
        return .entities.Event.create(dataToSave);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate(createPageUrl('Dashboard'));
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await .integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = (publish = false) => {
    const eventData = {
      ...formData,
      price: formData.is_paid ? parseFloat(formData.price) : 0,
      registration_limit: formData.registration_limit ? parseInt(formData.registration_limit) : null,
      certificate_hours: formData.has_certificate ? parseFloat(formData.certificate_hours) : null,
      organizer_id: user?.id,
      organizer_name: user?.full_name || user?.email,
      total_sessions: formData.is_periodic ? formData.periodic_dates.length : 1,
    };

    saveEventMutation.mutate({ eventData, publish });
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            {isEditing ? 'Editar evento' : 'Criar novo evento'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-6">
            {/* Basic Details Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-3 border-b">
                Informações Básicas
              </h2>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="title">Título do evento *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Workshop de React Avançado"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o que será abordado no evento, público-alvo, etc."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="image">Imagem do evento</Label>
                  <p className="text-xs text-slate-500 mt-1 mb-2">JPG, GIF ou PNG (recomendado: 1200x630px)</p>
                  <div className="flex items-start gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="flex-1"
                    />
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200"
                      />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Date, Time and Location Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-3 border-b">
                Data, Horário e Local
              </h2>
              
              <div className="space-y-5">
                <div>
                  <Label>Frequência</Label>
                  <Select
                    value={formData.is_periodic ? 'periodico' : 'unico'}
                    onValueChange={(value) => setFormData({ ...formData, is_periodic: value === 'periodico', periodic_dates: [] })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unico">Evento único</SelectItem>
                      <SelectItem value="periodico">Evento periódico (múltiplos encontros)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Data {formData.is_periodic ? 'inicial' : ''} *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_time">Início *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Término *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {formData.is_periodic && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <Label className="mb-3 block font-medium">Datas dos encontros *</Label>
                    <MultiDatePicker
                      selectedDates={formData.periodic_dates}
                      onChange={(dates) => setFormData({ ...formData, periodic_dates: dates })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_type">Formato *</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presencial">Presencial</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="hibrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Local *</Label>
                    <Input
                      id="location"
                      placeholder="Ex: Auditório Central, Link Zoom, etc."
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Tickets and Registration Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-3 border-b">
                Ingressos e Inscrições
              </h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de ingresso</Label>
                    <Select
                      value={formData.is_paid ? 'pago' : 'gratuito'}
                      onValueChange={(value) => setFormData({ ...formData, is_paid: value === 'pago' })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gratuito">Gratuito</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="registration_limit">Limite de vagas</Label>
                    <Input
                      id="registration_limit"
                      type="number"
                      placeholder="Deixe vazio para ilimitado"
                      value={formData.registration_limit || ''}
                      onChange={(e) => setFormData({ ...formData, registration_limit: e.target.value ? parseInt(e.target.value) : null })}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {formData.is_paid && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Valor do ingresso *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                          required
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="pix_code">Chave PIX para pagamento *</Label>
                      <Input
                        id="pix_code"
                        placeholder="Digite sua chave PIX (CPF, e-mail, telefone ou aleatória)"
                        value={formData.pix_code}
                        onChange={(e) => setFormData({ ...formData, pix_code: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Certificate Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 pb-3 border-b">
                Certificado
              </h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Emite certificado?</Label>
                    <Select
                      value={formData.has_certificate ? 'sim' : 'nao'}
                      onValueChange={(value) => setFormData({ ...formData, has_certificate: value === 'sim' })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.has_certificate && (
                    <div>
                      <Label htmlFor="certificate_hours">Carga horária (horas)</Label>
                      <Input
                        id="certificate_hours"
                        type="number"
                        placeholder="Ex: 8"
                        value={formData.certificate_hours}
                        onChange={(e) => setFormData({ ...formData, certificate_hours: parseFloat(e.target.value) })}
                        className="mt-1.5"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saveEventMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveEventMutation.isPending ? 'Salvando...' : 'Salvar rascunho'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saveEventMutation.isPending}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full sm:w-auto"
                  >
                    {saveEventMutation.isPending ? 'Publicando...' : 'Publicar evento'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}