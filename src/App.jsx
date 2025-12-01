import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, Trash2, Plus, Save, Edit, ChefHat, ArrowLeft, 
  Loader2, X, DollarSign, Clock, Users, Utensils, Search,
  BookOpen, Flame, Star, FileText, AlertTriangle
} from 'lucide-react';

// Configuración Supabase
const supabaseUrl = 'https://wqgdhorevqmutqwckkaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZ2Rob3JldnFtdXRxd2Nra2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1OTc5MzMsImV4cCI6MjA4MDE3MzkzM30.GGLY9ggjCOy4yati0Uu2x6hRQMlbaHddkofdVuJp_UA';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// API ImgBB
const IMGBB_API_KEY = '3b11e98678de0a1dcc141ecc06b2346b';

// Comprimir imagen
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
          } else {
            reject(new Error('Error comprimiendo'));
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Subir a ImgBB con mejor manejo de errores
async function uploadToImgBB(file) {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Error subiendo imagen');
    }
    return data.data.url;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La subida de imagen tardó demasiado');
    }
    throw error;
  }
}

const CATEGORIES = [
  { id: "pizza", name: "Pizza", icon: "🍕" },
  { id: "entrantes", name: "Entrantes", icon: "🥗" },
  { id: "ensaladas", name: "Ensaladas", icon: "🥬" },
  { id: "calientes", name: "Platos Calientes", icon: "🍲" },
  { id: "postres", name: "Postres", icon: "🍰" },
  { id: "preparaciones", name: "Preparaciones", icon: "🔪" }
];

// Lista de alérgenos según normativa EU
const ALLERGENS = [
  { id: "gluten", name: "Gluten", icon: "🌾" },
  { id: "crustaceos", name: "Crustáceos", icon: "🦐" },
  { id: "huevos", name: "Huevos", icon: "🥚" },
  { id: "pescado", name: "Pescado", icon: "🐟" },
  { id: "cacahuetes", name: "Cacahuetes", icon: "🥜" },
  { id: "soja", name: "Soja", icon: "🫘" },
  { id: "lacteos", name: "Lácteos", icon: "🥛" },
  { id: "frutos_secos", name: "Frutos secos", icon: "🌰" },
  { id: "apio", name: "Apio", icon: "🥬" },
  { id: "mostaza", name: "Mostaza", icon: "🟡" },
  { id: "sesamo", name: "Sésamo", icon: "⚪" },
  { id: "sulfitos", name: "Sulfitos", icon: "🍷" },
  { id: "altramuces", name: "Altramuces", icon: "🫛" },
  { id: "moluscos", name: "Moluscos", icon: "🦪" }
];

// Estilos CSS personalizados
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap');

  :root {
    --color-cream: #FDF8F3;
    --color-warm-white: #FFFCF9;
    --color-terracotta: #C4572A;
    --color-terracotta-dark: #A04520;
    --color-olive: #5C6B4A;
    --color-olive-light: #7A8B68;
    --color-charcoal: #2C2C2C;
    --color-warm-gray: #6B6560;
    --color-sand: #E8DFD5;
    --color-gold: #D4A853;
  }

  * {
    box-sizing: border-box;
  }

  body {
    font-family: 'Outfit', sans-serif;
    background: var(--color-cream);
    color: var(--color-charcoal);
    margin: 0;
    min-height: 100vh;
  }

  .font-display {
    font-family: 'Cormorant Garamond', serif;
  }

  .bg-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.03;
  }

  .card-hover {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-hover:hover {
    transform: translateY(-8px);
    box-shadow: 0 25px 50px -12px rgba(44, 44, 44, 0.15);
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--color-terracotta) 0%, var(--color-terracotta-dark) 100%);
    color: white;
    border: none;
    padding: 0.875rem 1.75rem;
    border-radius: 50px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    letter-spacing: 0.02em;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px -10px rgba(196, 87, 42, 0.5);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-secondary {
    background: var(--color-warm-white);
    color: var(--color-charcoal);
    border: 2px solid var(--color-sand);
    padding: 0.75rem 1.5rem;
    border-radius: 50px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-secondary:hover {
    border-color: var(--color-terracotta);
    color: var(--color-terracotta);
  }

  .input-field {
    width: 100%;
    padding: 1rem 1.25rem;
    border: 2px solid var(--color-sand);
    border-radius: 12px;
    font-size: 1rem;
    font-family: 'Outfit', sans-serif;
    background: var(--color-warm-white);
    transition: all 0.3s ease;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--color-terracotta);
    box-shadow: 0 0 0 4px rgba(196, 87, 42, 0.1);
  }

  .input-field::placeholder {
    color: #A9A29C;
  }

  .category-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 1rem;
    background: var(--color-sand);
    border-radius: 50px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-charcoal);
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .category-pill:hover {
    transform: scale(1.05);
  }

  .allergen-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: var(--color-sand);
    border-radius: 50px;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--color-charcoal);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .allergen-chip.selected {
    background: #FEE2E2;
    border-color: #EF4444;
    color: #DC2626;
  }

  .allergen-chip:hover {
    transform: scale(1.05);
  }

  .fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }

  .recipe-card-image {
    position: relative;
    overflow: hidden;
  }

  .recipe-card-image::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to top, rgba(44,44,44,0.6) 0%, transparent 100%);
  }

  /* PDF Print Styles */
  @media print {
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    
    body {
      background: white !important;
      font-size: 11pt;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .no-print {
      display: none !important;
    }
    
    .print-only {
      display: block !important;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .avoid-break {
      page-break-inside: avoid;
    }
  }
  
  .print-only {
    display: none;
  }
`;

export default function App() {
  const [userId] = useState(() => {
    let id = localStorage.getItem('chef_user_id');
    if (!id) {
      id = `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chef_user_id', id);
    }
    return id;
  });
  
  const [recipes, setRecipes] = useState([]);
  const [view, setView] = useState('list');
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadRecipes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error al cargar recetas', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async (formData) => {
    setLoading(true);
    let imageUploadWarning = false;
    
    try {
      // Procesar imágenes de los pasos
      const processedSteps = await Promise.all(formData.steps.map(async (step) => {
        if (step.tempImageFile) {
          try {
            const compressed = await compressImage(step.tempImageFile);
            const url = await uploadToImgBB(compressed);
            return { description: step.description, imageUrl: url };
          } catch (error) {
            console.error("Error subiendo imagen:", error);
            imageUploadWarning = true;
            // Si ya tenía una imagen anterior, mantenerla; si no, dejar vacío
            return { description: step.description, imageUrl: step.imageUrl?.startsWith('blob:') ? '' : (step.imageUrl || '') };
          }
        }
        // Si la URL es un blob local, no la guardamos
        const imageUrl = step.imageUrl?.startsWith('blob:') ? '' : (step.imageUrl || '');
        return { description: step.description, imageUrl };
      }));

      const recipeData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        yield: formData.yield,
        prep_time: formData.prep_time,
        ingredients: formData.ingredients,
        steps: processedSteps,
        allergens: formData.allergens || [],
        costing_enabled: formData.costing_enabled,
        total_cost: formData.total_cost,
        cost_per_portion: formData.cost_per_portion,
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      let supabaseError = null;

      if (activeRecipe?.id) {
        // Actualizar receta existente
        const result = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', activeRecipe.id);
        
        supabaseError = result.error;
      } else {
        // Crear nueva receta
        recipeData.created_at = new Date().toISOString();
        const result = await supabase
          .from('recipes')
          .insert([recipeData]);
        
        supabaseError = result.error;
      }

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message || 'Error en la base de datos');
      }
      
      // Recargar recetas y cambiar vista
      await loadRecipes();
      setActiveRecipe(null);
      setView('list');
      
      if (imageUploadWarning) {
        showNotification('Receta guardada (algunas imágenes no se subieron)', 'success');
      } else {
        showNotification(activeRecipe?.id ? '¡Receta actualizada!' : '¡Receta creada!');
      }
      
    } catch (e) {
      console.error("Error completo:", e);
      let errorMsg = 'Error al guardar';
      
      if (e.message?.includes('Failed to fetch')) {
        errorMsg = 'Error de conexión. Verifica tu internet.';
      } else if (e.message) {
        errorMsg = `Error: ${e.message}`;
      }
      
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta receta?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      await loadRecipes();
      if (activeRecipe?.id === id) {
        setActiveRecipe(null);
        setView('list');
      }
      showNotification('Receta eliminada');
    } catch (e) {
      showNotification('Error al eliminar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <style>{customStyles}</style>
      
      {/* Notification Toast */}
      {notification && (
        <div 
          className="fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl fade-in"
          style={{ 
            fontFamily: 'Outfit, sans-serif',
            background: notification.type === 'error' ? '#EF4444' : 'var(--color-olive)',
            color: 'white'
          }}
        >
          <div className="flex items-center gap-3">
            {notification.type === 'error' ? <X size={20} /> : <Star size={20} />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="min-h-screen relative" style={{ background: 'var(--color-cream)' }}>
        <div className="fixed inset-0 bg-noise pointer-events-none" />
        
        {/* Header */}
        <header className="sticky top-0 z-40 no-print" style={{ 
          background: 'rgba(253, 248, 243, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--color-sand)'
        }}>
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <div 
              className="flex items-center gap-4 cursor-pointer group" 
              onClick={() => { setView('list'); setActiveRecipe(null); }}
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, var(--color-terracotta) 0%, var(--color-terracotta-dark) 100%)' }}
              >
                <ChefHat size={26} className="text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--color-charcoal)' }}>
                  ChefManager
                </h1>
                <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--color-warm-gray)' }}>
                  Fichas Técnicas
                </p>
              </div>
            </div>
            
            {view !== 'list' && (
              <button onClick={() => { setView('list'); setActiveRecipe(null); }} className="btn-secondary">
                <ArrowLeft size={18} /> Volver
              </button>
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 relative">
          {loading && recipes.length === 0 && view === 'list' ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4" style={{ borderColor: 'var(--color-sand)' }} />
                <div 
                  className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent animate-spin"
                  style={{ borderTopColor: 'var(--color-terracotta)' }}
                />
              </div>
              <p className="mt-6 text-lg" style={{ color: 'var(--color-warm-gray)' }}>
                Cargando tus recetas...
              </p>
            </div>
          ) : (
            <>
              {view === 'list' && (
                <RecipeList 
                  recipes={filteredRecipes}
                  allRecipes={recipes}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  onCreate={() => { setActiveRecipe(null); setView('edit'); }}
                  onSelect={(r) => { setActiveRecipe(r); setView('view'); }}
                  onEdit={(r) => { setActiveRecipe(r); setView('edit'); }}
                  onDelete={handleDelete}
                />
              )}
              
              {view === 'edit' && (
                <RecipeEditor 
                  initialData={activeRecipe}
                  onSave={handleSave}
                  onCancel={() => { setView('list'); setActiveRecipe(null); }}
                  saving={loading}
                />
              )}

              {view === 'view' && activeRecipe && (
                <RecipeViewer 
                  recipe={activeRecipe}
                  recipes={recipes}
                  onEdit={() => setView('edit')}
                  onSelectRecipe={(r) => { setActiveRecipe(r); setView('view'); }}
                />
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

function RecipeList({ recipes, allRecipes, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, onCreate, onSelect, onEdit, onDelete }) {
  return (
    <div className="fade-in">
      <div className="text-center mb-12">
        <h2 className="font-display text-5xl md:text-6xl font-bold mb-4" style={{ color: 'var(--color-charcoal)' }}>
          Mis Fichas Técnicas
        </h2>
        <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--color-warm-gray)' }}>
          Organiza y accede a todas tus recetas profesionales en un solo lugar
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-grow relative">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--color-warm-gray)' }} />
          <input
            type="text"
            placeholder="Buscar recetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '3rem' }}
          />
        </div>
        <button onClick={onCreate} className="btn-primary">
          <Plus size={20} /> Nueva Ficha
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setSelectedCategory(null)}
          className="category-pill"
          style={{
            background: !selectedCategory ? 'var(--color-terracotta)' : 'var(--color-sand)',
            color: !selectedCategory ? 'white' : 'var(--color-charcoal)'
          }}
        >
          Todas ({allRecipes.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = allRecipes.filter(r => r.category === cat.name).length;
          const isActive = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isActive ? null : cat.name)}
              className="category-pill"
              style={{
                background: isActive ? 'var(--color-terracotta)' : 'var(--color-sand)',
                color: isActive ? 'white' : 'var(--color-charcoal)'
              }}
            >
              <span>{cat.icon}</span> {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {recipes.length === 0 ? (
        <div 
          className="text-center py-24 rounded-3xl border-2 border-dashed"
          style={{ borderColor: 'var(--color-sand)', background: 'var(--color-warm-white)' }}
        >
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'var(--color-sand)' }}>
            <BookOpen size={40} style={{ color: 'var(--color-warm-gray)' }} />
          </div>
          <h3 className="font-display text-2xl font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>
            {searchTerm || selectedCategory ? 'No hay resultados' : 'Tu libro de recetas está vacío'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--color-warm-gray)' }}>
            {searchTerm || selectedCategory ? 'Prueba con otros términos' : 'Comienza creando tu primera ficha técnica'}
          </p>
          {!searchTerm && !selectedCategory && (
            <button onClick={onCreate} className="btn-primary">
              <Plus size={20} /> Crear mi primera receta
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, index, onSelect, onEdit, onDelete }) {
  const mainImage = recipe.steps?.find(s => s.imageUrl)?.imageUrl;
  const categoryData = CATEGORIES.find(c => c.name === recipe.category);
  const hasAllergens = recipe.allergens && recipe.allergens.length > 0;
  
  return (
    <div 
      className={`card-hover rounded-3xl overflow-hidden fade-in stagger-${(index % 4) + 1}`}
      style={{ background: 'var(--color-warm-white)', boxShadow: '0 4px 20px -5px rgba(44, 44, 44, 0.08)' }}
    >
      <div className="recipe-card-image h-48 cursor-pointer relative" onClick={() => onSelect(recipe)} style={{ background: 'var(--color-sand)' }}>
        {mainImage ? (
          <img src={mainImage} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Utensils size={40} style={{ color: 'var(--color-warm-gray)', opacity: 0.5 }} />
          </div>
        )}
        {categoryData && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: 'rgba(255,255,255,0.95)' }}>
            <span className="mr-1">{categoryData.icon}</span> {categoryData.name}
          </div>
        )}
        {hasAllergens && (
          <div className="absolute top-4 right-4 z-10 p-2 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.9)' }} title="Contiene alérgenos">
            <AlertTriangle size={16} className="text-white" />
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-xl font-bold mb-2 cursor-pointer line-clamp-1" onClick={() => onSelect(recipe)} style={{ color: 'var(--color-charcoal)' }}>
          {recipe.title}
        </h3>
        <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--color-warm-gray)' }}>
          {recipe.description || 'Sin descripción'}
        </p>
        <div className="flex items-center gap-4 mb-4 text-sm" style={{ color: 'var(--color-warm-gray)' }}>
          {recipe.yield && <div className="flex items-center gap-1"><Users size={14} /><span>{recipe.yield}</span></div>}
          {recipe.prep_time && <div className="flex items-center gap-1"><Clock size={14} /><span>{recipe.prep_time}</span></div>}
        </div>
        <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--color-sand)' }}>
          {recipe.costing_enabled && recipe.cost_per_portion ? (
            <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--color-olive)' }}>
              <DollarSign size={14} /><span>{recipe.cost_per_portion}€/porción</span>
            </div>
          ) : <div />}
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(recipe); }} className="p-2.5 rounded-xl" style={{ color: 'var(--color-terracotta)' }}><Edit size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }} className="p-2.5 rounded-xl text-red-500"><Trash2 size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecipeEditor({ initialData, onSave, onCancel, saving }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'Platos Calientes',
    description: initialData?.description || '',
    yield: initialData?.yield || '',
    prep_time: initialData?.prep_time || '',
    ingredients: initialData?.ingredients || [{ item: '', quantity: '', unit: '', cost: '' }],
    steps: initialData?.steps || [{ description: '', imageUrl: '' }],
    allergens: initialData?.allergens || [],
    costing_enabled: initialData?.costing_enabled || false,
    total_cost: initialData?.total_cost || '',
    cost_per_portion: initialData?.cost_per_portion || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor, ingresa un nombre para el plato');
      return;
    }
    await onSave(formData);
  };

  const toggleAllergen = (allergenId) => {
    const current = formData.allergens || [];
    if (current.includes(allergenId)) {
      setFormData({ ...formData, allergens: current.filter(a => a !== allergenId) });
    } else {
      setFormData({ ...formData, allergens: [...current, allergenId] });
    }
  };

  const addIngredient = () => setFormData({ ...formData, ingredients: [...formData.ingredients, { item: '', quantity: '', unit: '', cost: '' }] });
  const updateIngredient = (index, field, value) => {
    const newIng = [...formData.ingredients];
    newIng[index] = { ...newIng[index], [field]: value };
    setFormData({ ...formData, ingredients: newIng });
  };
  const removeIngredient = (index) => {
    if (formData.ingredients.length === 1) return;
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };

  const addStep = () => setFormData({ ...formData, steps: [...formData.steps, { description: '', imageUrl: '' }] });
  const updateStep = (index, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], description: value };
    setFormData({ ...formData, steps: newSteps });
  };
  const handleImageSelect = (index, file) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], tempImageFile: file, imageUrl: URL.createObjectURL(file) };
    setFormData({ ...formData, steps: newSteps });
  };
  const removeStepImage = (index) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], tempImageFile: null, imageUrl: '' };
    setFormData({ ...formData, steps: newSteps });
  };
  const removeStep = (index) => {
    if (formData.steps.length === 1) return;
    setFormData({ ...formData, steps: formData.steps.filter((_, i) => i !== index) });
  };

  useEffect(() => {
    if (formData.costing_enabled) {
      const total = formData.ingredients.reduce((sum, ing) => sum + (parseFloat(ing.cost) || 0), 0);
      const yieldMatch = formData.yield?.match(/\d+/);
      const portions = yieldMatch ? parseFloat(yieldMatch[0]) : 1;
      setFormData(prev => ({
        ...prev,
        total_cost: total.toFixed(2),
        cost_per_portion: portions > 0 ? (total / portions).toFixed(2) : '0.00'
      }));
    }
  }, [formData.ingredients, formData.yield, formData.costing_enabled]);

  return (
    <form onSubmit={handleSubmit} className="fade-in">
      <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--color-warm-white)', boxShadow: '0 10px 40px -10px rgba(44, 44, 44, 0.1)' }}>
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderBottom: '2px solid var(--color-sand)' }}>
          <div>
            <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--color-charcoal)' }}>{initialData ? 'Editar Ficha' : 'Nueva Ficha Técnica'}</h2>
            <p style={{ color: 'var(--color-warm-gray)' }}>{initialData ? 'Modifica los detalles' : 'Crea una nueva receta profesional'}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><Loader2 className="animate-spin" size={20} />Guardando...</> : <><Save size={20} />Guardar</>}
            </button>
          </div>
        </div>

        <div className="p-6 md:p-10">
          {/* Costing Toggle */}
          <div className="mb-8 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(92, 107, 74, 0.1) 0%, rgba(92, 107, 74, 0.05) 100%)' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.costing_enabled} onChange={(e) => setFormData({...formData, costing_enabled: e.target.checked})} className="w-5 h-5" style={{ accentColor: 'var(--color-olive)' }} />
              <DollarSign className="w-5 h-5" style={{ color: 'var(--color-olive)' }} />
              <div>
                <span className="font-semibold" style={{ color: 'var(--color-charcoal)' }}>Habilitar Escandallo de Costos</span>
                <p className="text-sm" style={{ color: 'var(--color-warm-gray)' }}>Calcula el costo por porción</p>
              </div>
            </label>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>Nombre del Plato *</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field text-lg" placeholder="Ej: Risotto de Setas" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>Categoría</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
                {CATEGORIES.map(cat => <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>Rendimiento</label>
              <input type="text" value={formData.yield} onChange={e => setFormData({...formData, yield: e.target.value})} className="input-field" placeholder="Ej: 4 Porciones" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>Tiempo</label>
              <input type="text" value={formData.prep_time} onChange={e => setFormData({...formData, prep_time: e.target.value})} className="input-field" placeholder="Ej: 45 min" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>Descripción</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field resize-none" style={{ minHeight: '100px' }} placeholder="Breve descripción..." />
            </div>
          </div>

          {/* Allergens */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EF4444', color: 'white' }}><AlertTriangle size={20} /></div>
              <div className="flex-grow">
                <h3 className="font-display text-2xl font-bold" style={{ color: 'var(--color-charcoal)' }}>Alérgenos</h3>
                <p className="text-sm" style={{ color: 'var(--color-warm-gray)' }}>Selecciona los alérgenos presentes</p>
              </div>
              {formData.allergens.length > 0 && (
                <button type="button" onClick={() => setFormData({...formData, allergens: []})} className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--color-sand)' }}>
                  Limpiar
                </button>
              )}
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'var(--color-cream)' }}>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map(allergen => (
                  <button key={allergen.id} type="button" onClick={() => toggleAllergen(allergen.id)} className={`allergen-chip ${formData.allergens.includes(allergen.id) ? 'selected' : ''}`}>
                    <span>{allergen.icon}</span><span>{allergen.name}</span>
                  </button>
                ))}
              </div>
              {formData.allergens.length === 0 && <p className="mt-4 text-sm text-center" style={{ color: 'var(--color-warm-gray)' }}>✓ Sin alérgenos seleccionados</p>}
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-terracotta)', color: 'white' }}><Utensils size={20} /></div>
              <h3 className="font-display text-2xl font-bold" style={{ color: 'var(--color-charcoal)' }}>Ingredientes</h3>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'var(--color-cream)' }}>
              <div className="space-y-3">
                {formData.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex flex-wrap gap-3 items-center">
                    <input placeholder="Ingrediente" value={ing.item} onChange={e => updateIngredient(idx, 'item', e.target.value)} className="input-field flex-grow" style={{ minWidth: '200px' }} />
                    <input placeholder="Cant." value={ing.quantity} onChange={e => updateIngredient(idx, 'quantity', e.target.value)} className="input-field text-center" style={{ width: '80px' }} />
                    <input placeholder="Unidad" value={ing.unit} onChange={e => updateIngredient(idx, 'unit', e.target.value)} className="input-field text-center" style={{ width: '80px' }} />
                    {formData.costing_enabled && <input type="number" step="0.01" placeholder="€" value={ing.cost} onChange={e => updateIngredient(idx, 'cost', e.target.value)} className="input-field text-center" style={{ width: '80px' }} />}
                    <button type="button" onClick={() => removeIngredient(idx)} className="p-2 rounded-lg" disabled={formData.ingredients.length === 1} style={{ color: formData.ingredients.length === 1 ? '#ccc' : '#EF4444' }}><X size={18} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addIngredient} className="mt-4 flex items-center gap-2 font-semibold" style={{ color: 'var(--color-terracotta)' }}><Plus size={18} /> Añadir Ingrediente</button>
            </div>
            {formData.costing_enabled && parseFloat(formData.total_cost) > 0 && (
              <div className="mt-4 p-5 rounded-2xl grid grid-cols-2 gap-6" style={{ background: 'linear-gradient(135deg, rgba(92, 107, 74, 0.15) 0%, rgba(92, 107, 74, 0.08) 100%)' }}>
                <div><p className="text-sm font-medium mb-1" style={{ color: 'var(--color-olive)' }}>Costo Total</p><p className="text-2xl font-bold" style={{ color: 'var(--color-charcoal)' }}>{formData.total_cost}€</p></div>
                <div><p className="text-sm font-medium mb-1" style={{ color: 'var(--color-olive)' }}>Costo/Porción</p><p className="text-2xl font-bold" style={{ color: 'var(--color-charcoal)' }}>{formData.cost_per_portion}€</p></div>
              </div>
            )}
          </div>

          {/* Steps - 30% image, 70% description */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-olive)', color: 'white' }}><Flame size={20} /></div>
              <h3 className="font-display text-2xl font-bold" style={{ color: 'var(--color-charcoal)' }}>Procedimiento</h3>
            </div>
            <div className="space-y-4">
              {formData.steps.map((step, idx) => (
                <div key={idx} className="rounded-2xl p-5" style={{ background: 'var(--color-cream)' }}>
                  <div className="flex gap-4">
                    <div className="flex-none w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: 'var(--color-charcoal)', color: 'white' }}>{idx + 1}</div>
                    
                    {/* Content container with 30/70 split */}
                    <div className="flex-grow flex flex-col md:flex-row gap-4" style={{ minWidth: 0 }}>
                      {/* Image - 30% */}
                      <div className="flex-none rounded-xl overflow-hidden relative" style={{ background: 'var(--color-sand)', width: '30%', minWidth: '120px', maxWidth: '180px', height: '140px' }}>
                        {step.imageUrl ? (
                          <>
                            <img src={step.imageUrl} alt={`Paso ${idx + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeStepImage(idx)} className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white"><X size={14} /></button>
                          </>
                        ) : (
                          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                            <Camera size={24} style={{ color: 'var(--color-warm-gray)' }} />
                            <span className="text-xs mt-1" style={{ color: 'var(--color-warm-gray)' }}>Añadir foto</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageSelect(idx, e.target.files[0])} />
                          </label>
                        )}
                      </div>
                      
                      {/* Description - 70% */}
                      <div style={{ flex: '1 1 70%', minWidth: 0 }}>
                        <textarea value={step.description} onChange={e => updateStep(idx, e.target.value)} placeholder="Describe este paso..." className="input-field resize-none w-full h-full" style={{ minHeight: '140px' }} />
                      </div>
                    </div>
                    
                    <button type="button" onClick={() => removeStep(idx)} className="flex-none p-2 rounded-lg self-start" disabled={formData.steps.length === 1} style={{ color: formData.steps.length === 1 ? '#ccc' : '#EF4444' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addStep} className="w-full py-5 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 font-semibold" style={{ borderColor: 'var(--color-sand)', color: 'var(--color-warm-gray)' }}><Plus size={20} /> Añadir Paso</button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function RecipeViewer({ recipe, recipes, onEdit, onSelectRecipe }) {
  const mainImage = recipe.steps?.find(s => s.imageUrl)?.imageUrl;
  const categoryData = CATEGORIES.find(c => c.name === recipe.category);
  const recipeAllergens = (recipe.allergens || []).map(id => ALLERGENS.find(a => a.id === id)).filter(Boolean);

  // Función para buscar receta de preparación por nombre de ingrediente
  const findPrepRecipe = (ingredientName) => {
    if (!ingredientName.toLowerCase().includes('prep')) return null;
    
    // Extraer el nombre base (sin "prep")
    const baseName = ingredientName.toLowerCase().replace(/\s*prep\s*/gi, '').trim();
    
    // Buscar en recetas de categoría "Preparaciones" o que coincidan con el nombre
    return recipes?.find(r => {
      const recipeTitle = r.title?.toLowerCase() || '';
      return r.id !== recipe.id && (
        recipeTitle.includes(baseName) ||
        baseName.includes(recipeTitle.replace(/preparación|prep|base/gi, '').trim())
      );
    });
  };

  // Componente para renderizar ingrediente (con o sin link)
  const IngredientItem = ({ ing, showCost = false }) => {
    const prepRecipe = findPrepRecipe(ing.item);
    
    return (
      <li className="flex justify-between items-baseline pb-2" style={{ borderBottom: '1px dashed var(--color-sand)' }}>
        <span className="font-medium" style={{ color: 'var(--color-charcoal)' }}>
          {prepRecipe ? (
            <button
              onClick={() => onSelectRecipe(prepRecipe)}
              className="inline-flex items-center gap-1 hover:underline"
              style={{ color: 'var(--color-terracotta)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, font: 'inherit' }}
              title={`Ver receta: ${prepRecipe.title}`}
            >
              {ing.item}
              <span style={{ fontSize: '12px' }}>🔗</span>
            </button>
          ) : (
            ing.item
          )}
        </span>
        <span className="text-sm ml-2 flex items-center gap-2" style={{ color: 'var(--color-warm-gray)' }}>
          {ing.quantity} {ing.unit}
          {showCost && ing.cost && <span style={{ color: 'var(--color-olive)' }}>({ing.cost}€)</span>}
        </span>
      </li>
    );
  };

  return (
    <div className="fade-in">
      {/* Actions */}
      <div className="flex justify-end gap-3 mb-6 no-print">
        <button onClick={onEdit} className="btn-secondary"><Edit size={18} /> Editar</button>
        <button onClick={() => window.print()} className="btn-primary"><FileText size={18} /> Generar PDF</button>
      </div>

      {/* Screen View */}
      <div className="rounded-3xl overflow-hidden no-print" style={{ background: 'var(--color-warm-white)', boxShadow: '0 10px 40px -10px rgba(44, 44, 44, 0.1)' }}>
        {mainImage && (
          <div className="relative h-64 md:h-80">
            <img src={mainImage} alt={recipe.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(44,44,44,0.8) 0%, transparent 60%)' }} />
          </div>
        )}

        <div className="p-8 md:p-12">
          <div className="mb-10" style={{ borderBottom: '2px solid var(--color-charcoal)' }}>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {categoryData && <span className="category-pill"><span>{categoryData.icon}</span> {categoryData.name}</span>}
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--color-charcoal)' }}>{recipe.title}</h1>
            {recipe.description && <p className="text-lg italic mb-6" style={{ color: 'var(--color-warm-gray)' }}>{recipe.description}</p>}
            <div className="flex flex-wrap gap-4 pb-6">
              {recipe.yield && <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--color-sand)' }}><Users size={18} /><span className="font-medium">{recipe.yield}</span></div>}
              {recipe.prep_time && <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--color-sand)' }}><Clock size={18} /><span className="font-medium">{recipe.prep_time}</span></div>}
              {recipe.costing_enabled && recipe.cost_per_portion && <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(92, 107, 74, 0.2)' }}><DollarSign size={18} style={{ color: 'var(--color-olive)' }} /><span className="font-medium" style={{ color: 'var(--color-olive)' }}>{recipe.cost_per_portion}€/porción</span></div>}
            </div>
          </div>

          {recipeAllergens.length > 0 && (
            <div className="mb-8 p-5 rounded-2xl" style={{ background: '#FEF2F2', border: '2px solid #FECACA' }}>
              <div className="flex items-center gap-2 mb-3"><AlertTriangle size={20} className="text-red-500" /><h3 className="font-bold text-red-700">Alérgenos</h3></div>
              <div className="flex flex-wrap gap-2">
                {recipeAllergens.map(a => <span key={a.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium" style={{ background: '#FEE2E2', color: '#DC2626' }}><span>{a.icon}</span> {a.name}</span>)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(196, 87, 42, 0.08) 0%, rgba(196, 87, 42, 0.03) 100%)' }}>
                <h3 className="font-display text-xl font-bold uppercase tracking-wider mb-5 pb-3" style={{ color: 'var(--color-terracotta)', borderBottom: '2px solid var(--color-terracotta)' }}>Ingredientes</h3>
                <ul className="space-y-3">
                  {recipe.ingredients?.map((ing, i) => (
                    <IngredientItem key={i} ing={ing} showCost={recipe.costing_enabled} />
                  ))}
                </ul>
                {recipe.costing_enabled && recipe.total_cost && (
                  <div className="mt-6 pt-4" style={{ borderTop: '2px solid var(--color-terracotta)' }}>
                    <div className="flex justify-between mb-2"><span className="font-semibold">Costo Total:</span><span className="font-bold text-lg" style={{ color: 'var(--color-terracotta)' }}>{recipe.total_cost}€</span></div>
                    <div className="flex justify-between"><span className="text-sm" style={{ color: 'var(--color-warm-gray)' }}>Por porción:</span><span className="font-semibold" style={{ color: 'var(--color-terracotta)' }}>{recipe.cost_per_portion}€</span></div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-display text-xl font-bold uppercase tracking-wider mb-8 pb-3" style={{ color: 'var(--color-charcoal)', borderBottom: '2px solid var(--color-charcoal)' }}>Procedimiento</h3>
              <div className="space-y-8">
                {recipe.steps?.map((step, i) => (
                  <div key={i} className="flex gap-5">
                    <div className="flex-none"><div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl" style={{ background: 'var(--color-charcoal)', color: 'white' }}>{i + 1}</div></div>
                    <div className="flex-grow pt-2">
                      <p className="text-lg leading-relaxed mb-4" style={{ color: 'var(--color-charcoal)', whiteSpace: 'pre-wrap' }}>{step.description}</p>
                      {step.imageUrl && <div className="rounded-xl overflow-hidden inline-block" style={{ maxWidth: '300px' }}><img src={step.imageUrl} alt={`Paso ${i + 1}`} className="w-full h-auto" /></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print PDF Layout */}
      <div className="print-only" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: '1.5', color: '#333' }}>
        {/* Header */}
        <div style={{ borderBottom: '3px solid #2C2C2C', paddingBottom: '15px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '28pt', fontWeight: 'bold', margin: '0 0 5px 0' }}>{recipe.title}</h1>
          {recipe.description && <p style={{ fontStyle: 'italic', color: '#666', margin: '5px 0' }}>{recipe.description}</p>}
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '10pt', color: '#666' }}>
            {categoryData && <span>{categoryData.icon} {categoryData.name}</span>}
            {recipe.yield && <span>📊 {recipe.yield}</span>}
            {recipe.prep_time && <span>⏱️ {recipe.prep_time}</span>}
            {recipe.costing_enabled && recipe.cost_per_portion && <span>💰 {recipe.cost_per_portion}€/porción</span>}
          </div>
        </div>

        {/* Allergens */}
        {recipeAllergens.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '10px 15px', background: '#FEF2F2', borderRadius: '8px', pageBreakInside: 'avoid' }}>
            <h3 style={{ color: '#DC2626', margin: '0 0 8px 0', fontSize: '12pt' }}>⚠️ Alérgenos</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {recipeAllergens.map(a => <span key={a.id} style={{ padding: '4px 10px', background: '#FEE2E2', borderRadius: '20px', fontSize: '9pt', color: '#DC2626' }}>{a.icon} {a.name}</span>)}
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
          <h3 style={{ color: '#C4572A', borderBottom: '2px solid #C4572A', paddingBottom: '5px', marginBottom: '10px', fontSize: '14pt' }}>Ingredientes</h3>
          <div style={{ columns: 2, columnGap: '30px' }}>
            {recipe.ingredients?.map((ing, i) => {
              const isPrepItem = ing.item?.toLowerCase().includes('prep');
              const prepRecipe = isPrepItem ? findPrepRecipe(ing.item) : null;
              return (
                <div key={i} style={{ breakInside: 'avoid', padding: '3px 0', borderBottom: '1px dotted #ddd' }}>
                  <strong style={{ color: isPrepItem ? '#C4572A' : 'inherit' }}>
                    {ing.item} {prepRecipe && <span style={{ fontSize: '9pt' }}>🔗</span>}
                  </strong>
                  <span style={{ float: 'right', color: '#666' }}>{ing.quantity} {ing.unit}</span>
                </div>
              );
            })}
          </div>
          {recipe.costing_enabled && recipe.total_cost && (
            <div style={{ marginTop: '15px', padding: '10px 15px', background: '#F0FDF4', borderRadius: '8px' }}>
              <strong>Costo Total: {recipe.total_cost}€</strong>
              <span style={{ marginLeft: '20px' }}>Por porción: {recipe.cost_per_portion}€</span>
            </div>
          )}
        </div>

        {/* Procedure */}
        <div>
          <h3 style={{ color: '#2C2C2C', borderBottom: '2px solid #2C2C2C', paddingBottom: '5px', marginBottom: '15px', fontSize: '14pt' }}>Procedimiento</h3>
          {recipe.steps?.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '15px', pageBreakInside: 'avoid' }}>
              <div style={{ flexShrink: 0, width: '28px', height: '28px', background: '#2C2C2C', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12pt' }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0 }}>{step.description}</p>
                {step.imageUrl && <img src={step.imageUrl} alt={`Paso ${i + 1}`} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', marginTop: '8px' }} />}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #ddd', fontSize: '9pt', color: '#999', textAlign: 'center' }}>
          Ficha técnica generada con ChefManager • {new Date().toLocaleDateString('es-ES')}
        </div>
      </div>
    </div>
  );
}
