// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function UltimateEstimator() {
  const supabase = createClient();
  
  const [category, setCategory] = useState('marketing');
  const [quantity, setQuantity] = useState(0);
  const [complexity, setComplexity] = useState(1);
  const [description, setDescription] = useState(''); // Variable pour stocker le texte
  
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [licenseCode, setLicenseCode] = useState('');
  const [status, setStatus] = useState('');
  const [isCalculated, setIsCalculated] = useState(false);

  const projectTypes = {
    marketing: { label: "📈 Marketing & Pub", unit: "Nombre de campagnes / visuels", price: 250, icon: "🚀" },
    renovation: { label: "🏠 Rénovation & Immo", unit: "Surface totale en m²", price: 1400, icon: "🏗️" },
    tech: { label: "💻 Développement Web/IA", unit: "Nombre de fonctionnalités", price: 800, icon: "🤖" },
    design: { label: "🎨 Design & Branding", unit: "Nombre de déclinaisons", price: 350, icon: "💎" },
    event: { label: "🎉 Événementiel", unit: "Nombre d'invités", price: 75, icon: "🥂" },
    object: { label: "📦 Conception Produit", unit: "Complexité des prototypes", price: 1200, icon: "🛠️" }
  };

  useEffect(() => {
    const getData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        setUser({ ...authUser, ...profile });
      }
    };
    getData();
  }, []);

  const handleEstimate = async () => {
    if (!user) return;
    if (!user.est_premium && user.compteur_essais >= 2) {
      setStatus("Limite gratuite atteinte.");
      return;
    }

    // Calcul de base
    const basePrice = projectTypes[category].price;
    const total = (quantity * basePrice) * complexity;
    
    // Note : Pour l'instant on affiche le calcul mathématique, 
    // mais la variable 'description' est maintenant prête à être envoyée à une IA.
    setResult(total);
    setIsCalculated(true);

    if (!user.est_premium) {
      const nextCount = (user.compteur_essais || 0) + 1;
      await supabase.from('profiles').update({ compteur_essais: nextCount }).eq('id', user.id);
      setUser({ ...user, compteur_essais: nextCount });
    }
  };

  const handleActivate = async () => {
    const { data: licence } = await supabase.from('licences').select('*').eq('code_secret', licenseCode).eq('est_utilise', false).single();
    if (licence) {
      await supabase.from('profiles').update({ est_premium: true }).eq('id', user.id);
      await supabase.from('licences').update({ est_utilise: true }).eq('code_secret', licenseCode);
      setUser({ ...user, est_premium: true });
      setStatus("✅ ACCÈS VIP ACTIVÉ !");
    } else {
      setStatus("❌ Code invalide ou déjà utilisé.");
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-slate-500">
        Connexion en cours...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans text-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
