/**
 * Página de Agendamentos
 * 
 * Sistema completo de agendamento com calendário, clientes, profissionais, serviços e lista de espera.
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensions } from '@/contexts/ExtensionsContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Loader2,
  Users,
  Briefcase,
  Building,
  CalendarDays,
  List,
  UserPlus,
  Settings,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Tag,
  MessageSquare,
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Tipos
interface AppointmentClient {
  id: number;
  name: string;
  phone: string;
  email?: string;
  internalNotes?: string;
  tags?: string;
  lastAppointment?: {
    startTime: string;
    service: { name: string };
    professional?: { name: string };
  };
}

interface AppointmentProfessional {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  color?: string;
}

interface AppointmentService {
  id: number;
  name: string;
  description?: string;
  duration: number;
  price?: number;
  color?: string;
}

interface AppointmentRoom {
  id: number;
  name: string;
  capacity?: number;
  color?: string;
}

interface Appointment {
  id: number;
  clientId: number;
  professionalId?: number;
  serviceId: number;
  roomId?: number;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'STARTED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  internalNotes?: string;
  clientNotes?: string;
  checkedInAt?: string;
  completedAt?: string;
  client: AppointmentClient;
  professional?: AppointmentProfessional;
  service: AppointmentService;
  room?: AppointmentRoom;
}

interface Waitlist {
  id: number;
  clientId: number;
  serviceId: number;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  status: 'WAITING' | 'OFFERED' | 'CONVERTED' | 'CANCELLED';
  client: AppointmentClient;
  service: AppointmentService;
}

type ViewType = 'day' | 'week' | 'month' | 'professional' | 'room';

export default function AppointmentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, companyId } = useAuth();
  const { hasExtension, isLoading: extensionsLoading } = useExtensions();
  
  // Estados principais
  const [clients, setClients] = useState<AppointmentClient[]>([]);
  const [professionals, setProfessionals] = useState<AppointmentProfessional[]>([]);
  const [services, setServices] = useState<AppointmentService[]>([]);
  const [rooms, setRooms] = useState<AppointmentRoom[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<Waitlist[]>([]);
  
  // Estados de UI
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados de modais
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  
  // Estados de formulários
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    internalNotes: '',
    tags: '',
  });
  
  const [appointmentForm, setAppointmentForm] = useState({
    clientId: '',
    professionalId: '',
    serviceId: '',
    roomId: '',
    startTime: '',
    internalNotes: '',
    clientNotes: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && companyId) {
      fetchAllData();
    } else if (isAuthenticated && !companyId) {
      router.push('/workspace');
    }
  }, [isAuthenticated, companyId, router, currentDate, view]);

  const fetchAllData = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [clientsRes, professionalsRes, servicesRes, roomsRes, appointmentsRes, waitlistRes] = await Promise.all([
        api.get(`/companies/${companyId}/appointments/clients`).catch(() => ({ data: { data: [] } })),
        api.get(`/companies/${companyId}/appointments/professionals`).catch(() => ({ data: { data: [] } })),
        api.get(`/companies/${companyId}/appointments/services`).catch(() => ({ data: { data: [] } })),
        api.get(`/companies/${companyId}/appointments/rooms`).catch(() => ({ data: { data: [] } })),
        api.get(`/companies/${companyId}/appointments/appointments`, {
          params: getAppointmentFilters(),
        }).catch(() => ({ data: { data: [] } })),
        api.get(`/companies/${companyId}/appointments/waitlist`).catch(() => ({ data: { data: [] } })),
      ]);

      setClients(clientsRes.data?.data || []);
      setProfessionals(professionalsRes.data?.data || []);
      setServices(servicesRes.data?.data || []);
      setRooms(roomsRes.data?.data || []);
      setAppointments(appointmentsRes.data?.data || []);
      setWaitlist(waitlistRes.data?.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAppointmentFilters = () => {
    const filters: any = {};
    
    if (view === 'day') {
      filters.startDate = format(currentDate, "yyyy-MM-dd'T'00:00:00");
      filters.endDate = format(currentDate, "yyyy-MM-dd'T'23:59:59");
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: ptBR });
      const weekEnd = endOfWeek(currentDate, { locale: ptBR });
      filters.startDate = format(weekStart, "yyyy-MM-dd'T'00:00:00");
      filters.endDate = format(weekEnd, "yyyy-MM-dd'T'23:59:59");
    } else if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      filters.startDate = format(monthStart, "yyyy-MM-dd'T'00:00:00");
      filters.endDate = format(monthEnd, "yyyy-MM-dd'T'23:59:59");
    }

    return filters;
  };

  const handleCreateClient = async () => {
    if (!companyId) return;

    try {
      const tagsArray = clientForm.tags.split(',').map(t => t.trim()).filter(Boolean);
      const response = await api.post(`/companies/${companyId}/appointments/clients`, {
        ...clientForm,
        tags: tagsArray.length > 0 ? JSON.stringify(tagsArray) : undefined,
      });

      if (response.data.success) {
        setSuccess('Cliente criado com sucesso!');
        setShowClientModal(false);
        setClientForm({ name: '', phone: '', email: '', internalNotes: '', tags: '' });
        await fetchAllData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar cliente');
    }
  };

  const handleCreateAppointment = async () => {
    if (!companyId) return;

    try {
      const response = await api.post(`/companies/${companyId}/appointments/appointments`, {
        ...appointmentForm,
        professionalId: appointmentForm.professionalId || undefined,
        roomId: appointmentForm.roomId || undefined,
      });

      if (response.data.success) {
        setSuccess('Agendamento criado com sucesso!');
        setShowAppointmentModal(false);
        setAppointmentForm({
          clientId: '',
          professionalId: '',
          serviceId: '',
          roomId: '',
          startTime: '',
          internalNotes: '',
          clientNotes: '',
        });
        await fetchAllData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar agendamento');
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: number, status: Appointment['status']) => {
    if (!companyId) return;

    try {
      await api.put(`/companies/${companyId}/appointments/appointments/${appointmentId}`, {
        status,
      });
      setSuccess('Status atualizado com sucesso!');
      await fetchAllData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    }
  };

  // Calendário - dias da semana/mês
  const calendarDays = useMemo(() => {
    if (view === 'day') {
      return [currentDate];
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: ptBR });
      return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    } else if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
    return [];
  }, [currentDate, view]);

  // Agendamentos por dia
  const appointmentsByDay = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    calendarDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = appointments.filter(apt => 
        isSameDay(parseISO(apt.startTime), day)
      );
    });
    return grouped;
  }, [appointments, calendarDays]);

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      STARTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusLabel = (status: Appointment['status']) => {
    const labels = {
      PENDING: 'Pendente',
      CONFIRMED: 'Confirmado',
      STARTED: 'Iniciado',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
      NO_SHOW: 'Não compareceu',
    };
    return labels[status] || status;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa selecionada</h3>
            <Button onClick={() => router.push('/workspace')}>Ir para Área de Trabalho</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie agendamentos, clientes e profissionais
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowClientModal(true)} variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
          <Button onClick={() => setShowAppointmentModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-300 dark:border-green-700">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="waitlist">
            <List className="h-4 w-4 mr-2" />
            Lista de Espera
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Calendário */}
        <TabsContent value="calendar" className="space-y-4">
          {/* Controles do calendário */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(addDays(currentDate, -1))}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(addDays(currentDate, 1))}
                  >
                    →
                  </Button>
                  <span className="ml-4 font-semibold">
                    {format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={view} onValueChange={(v: ViewType) => setView(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Dia</SelectItem>
                      <SelectItem value="week">Semana</SelectItem>
                      <SelectItem value="month">Mês</SelectItem>
                      <SelectItem value="professional">Por Profissional</SelectItem>
                      <SelectItem value="room">Por Sala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid do calendário */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className={cn(
                  "grid min-w-[800px]",
                  view === 'day' && "grid-cols-1",
                  view === 'week' && "grid-cols-7",
                  view === 'month' && "grid-cols-7",
                )}>
                  {/* Cabeçalho dos dias */}
                  {(view === 'week' || view === 'month') && (
                    <>
                      {calendarDays.map((day, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "border-r border-b p-2 text-center font-semibold",
                            isToday(day) && "bg-primary/10"
                          )}
                        >
                          <div className="text-sm text-muted-foreground">
                            {format(day, 'EEE', { locale: ptBR })}
                          </div>
                          <div className={cn(
                            "text-lg",
                            isToday(day) && "text-primary font-bold"
                          )}>
                            {format(day, 'd')}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Células de agendamentos */}
                  {calendarDays.map((day, dayIdx) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayAppointments = appointmentsByDay[dayKey] || [];
                    
                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "border-r border-b min-h-[200px] p-2",
                          view === 'day' && "border-l",
                          isToday(day) && "bg-primary/5"
                        )}
                      >
                        {(view === 'day' || view === 'week') && (
                          <div className="text-sm font-semibold mb-2">
                            {format(day, "dd 'de' MMMM", { locale: ptBR })}
                          </div>
                        )}
                        <div className="space-y-1">
                          {dayAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className={cn(
                                "p-2 rounded text-xs cursor-pointer hover:shadow-md transition-all",
                                getStatusColor(apt.status),
                                apt.service.color && `border-l-4`,
                              )}
                              style={{
                                borderLeftColor: apt.service.color || undefined,
                              }}
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              <div className="font-semibold truncate">
                                {format(parseISO(apt.startTime), 'HH:mm')} - {apt.client.name}
                              </div>
                              <div className="text-xs opacity-75 truncate">
                                {apt.service.name}
                              </div>
                              {apt.professional && (
                                <div className="text-xs opacity-75 truncate">
                                  {apt.professional.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Clientes */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Gerencie seus clientes e visualize histórico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.map((client) => {
                  const lastVisit = client.lastAppointment;
                  const daysSinceLastVisit = lastVisit
                    ? differenceInDays(new Date(), parseISO(lastVisit.startTime))
                    : null;

                  return (
                    <Card key={client.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{client.name}</h3>
                              {client.tags && (
                                <div className="flex gap-1">
                                  {JSON.parse(client.tags).map((tag: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      <Tag className="h-3 w-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {client.phone}
                              </div>
                              {client.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {client.email}
                                </div>
                              )}
                              {lastVisit && (
                                <div className="mt-2 p-2 bg-muted rounded">
                                  <div className="font-medium text-foreground">Última visita:</div>
                                  <div className="text-xs">
                                    {format(parseISO(lastVisit.startTime), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                  </div>
                                  <div className="text-xs">
                                    Serviço: {lastVisit.service.name}
                                  </div>
                                  {lastVisit.professional && (
                                    <div className="text-xs">
                                      Profissional: {lastVisit.professional.name}
                                    </div>
                                  )}
                                  {daysSinceLastVisit !== null && (
                                    <div className="text-xs font-medium mt-1">
                                      Há {daysSinceLastVisit} {daysSinceLastVisit === 1 ? 'dia' : 'dias'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Lista de Espera */}
        <TabsContent value="waitlist" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Espera</CardTitle>
                  <CardDescription>Clientes aguardando horários disponíveis</CardDescription>
                </div>
                <Button onClick={() => setShowWaitlistModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {waitlist.filter(w => w.status === 'WAITING').map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.client.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Serviço: {item.service.name}
                          </p>
                          {item.preferredDate && (
                            <p className="text-sm text-muted-foreground">
                              Data preferida: {format(parseISO(item.preferredDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          )}
                          {item.preferredTime && (
                            <p className="text-sm text-muted-foreground">
                              Horário preferido: {item.preferredTime}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            // Converter para agendamento
                            setAppointmentForm({
                              clientId: item.clientId.toString(),
                              serviceId: item.serviceId.toString(),
                              professionalId: '',
                              roomId: '',
                              startTime: item.preferredDate || '',
                              internalNotes: '',
                              clientNotes: item.notes || '',
                            });
                            setShowAppointmentModal(true);
                          }}
                        >
                          Agendar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Profissionais</CardTitle>
                <CardDescription>Gerencie profissionais/atendentes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowProfessionalModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Profissional
                </Button>
                <div className="mt-4 space-y-2">
                  {professionals.map((prof) => (
                    <div key={prof.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{prof.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Serviços</CardTitle>
                <CardDescription>Gerencie serviços oferecidos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowServiceModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
                <div className="mt-4 space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium">{service.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Salas/Recursos</CardTitle>
                <CardDescription>Gerencie salas e recursos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShowRoomModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Sala
                </Button>
                <div className="mt-4 space-y-2">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{room.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Novo Cliente */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome *</Label>
              <Input
                id="clientName"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Telefone (WhatsApp) *</Label>
              <Input
                id="clientPhone"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Email (Opcional)</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientTags">Tags (separadas por vírgula)</Label>
              <Input
                id="clientTags"
                value={clientForm.tags}
                onChange={(e) => setClientForm({ ...clientForm, tags: e.target.value })}
                placeholder="VIP, Frequente, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientNotes">Observações Internas</Label>
              <Textarea
                id="clientNotes"
                value={clientForm.internalNotes}
                onChange={(e) => setClientForm({ ...clientForm, internalNotes: e.target.value })}
                placeholder="Observações sobre o cliente..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowClientModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateClient}>
                Criar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Agendamento */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Crie um novo agendamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentClient">Cliente *</Label>
              <Select
                value={appointmentForm.clientId}
                onValueChange={(value) => setAppointmentForm({ ...appointmentForm, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentService">Serviço *</Label>
              <Select
                value={appointmentForm.serviceId}
                onValueChange={(value) => setAppointmentForm({ ...appointmentForm, serviceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentProfessional">Profissional (Opcional)</Label>
                <Select
                  value={appointmentForm.professionalId}
                  onValueChange={(value) => setAppointmentForm({ ...appointmentForm, professionalId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id.toString()}>
                        {prof.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentRoom">Sala/Recurso (Opcional)</Label>
                <Select
                  value={appointmentForm.roomId}
                  onValueChange={(value) => setAppointmentForm({ ...appointmentForm, roomId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma sala" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentStartTime">Data e Hora de Início *</Label>
              <Input
                id="appointmentStartTime"
                type="datetime-local"
                value={appointmentForm.startTime}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentClientNotes">Observações do Cliente</Label>
              <Textarea
                id="appointmentClientNotes"
                value={appointmentForm.clientNotes}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, clientNotes: e.target.value })}
                placeholder="Observações do cliente..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentInternalNotes">Observações Internas</Label>
              <Textarea
                id="appointmentInternalNotes"
                value={appointmentForm.internalNotes}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, internalNotes: e.target.value })}
                placeholder="Observações internas..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAppointmentModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAppointment}>
                Criar Agendamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalhes do Agendamento */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-semibold">{selectedAppointment.client.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Serviço</Label>
                  <p className="font-semibold">{selectedAppointment.service.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data/Hora</Label>
                  <p className="font-semibold">
                    {format(parseISO(selectedAppointment.startTime), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {getStatusLabel(selectedAppointment.status)}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedAppointment.status === 'PENDING' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateAppointmentStatus(selectedAppointment.id, 'CONFIRMED')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar
                  </Button>
                )}
                {selectedAppointment.status === 'CONFIRMED' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateAppointmentStatus(selectedAppointment.id, 'STARTED')}
                  >
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Iniciar
                  </Button>
                )}
                {selectedAppointment.status === 'STARTED' && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateAppointmentStatus(selectedAppointment.id, 'COMPLETED')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir
                  </Button>
                )}
                {['PENDING', 'CONFIRMED'].includes(selectedAppointment.status) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleUpdateAppointmentStatus(selectedAppointment.id, 'CANCELLED')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
                {selectedAppointment.status === 'CONFIRMED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateAppointmentStatus(selectedAppointment.id, 'NO_SHOW')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Não Compareceu
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

