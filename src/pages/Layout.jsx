
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {  } from '@/api/Client';
import { Button } from '@/components/ui/button';
import { Calendar, Users, PlusCircle, LogOut, Menu, X } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await .auth.me();
        setUser(currentUser);
      } catch (err) {
        // Not authenticated - redirect to login
        .auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    .auth.logout();
  };

  if (!user) {
    return null;
  }

  const isAdmin = user?.role === 'admin';

  const navigation = [
    { name: 'Eventos', page: 'Dashboard', icon: Calendar, show: true },
    { name: 'Criar evento', page: 'CreateEvent', icon: PlusCircle, show: true },
    { name: 'Gerenciar usuarios', page: 'ManageOrganizers', icon: Users, show: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        :root {
          --primary: 238 76% 62%;
          --primary-foreground: 0 0% 100%;
        }
      `}</style>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hidden sm:block">
                EventFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.filter(item => item.show).map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    currentPageName === item.page
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user?.full_name || user?.email}</p>
                  <p className="text-xs text-slate-400">
                    {isAdmin ? 'Administrador' : 'Organizador'}
                  </p>
                </div>
                {user?.profile_image_url ? (
                  <img
                    src={user.profile_image_url}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full border-2 border-indigo-400"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-300 hover:text-white hover:bg-white/10"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-slate-700">
              {navigation.filter(item => item.show).map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    currentPageName === item.page
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">EventFlow</p>
                <p className="text-xs text-slate-400">Sistema de Gestão de Eventos</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              © 2024 EventFlow. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
