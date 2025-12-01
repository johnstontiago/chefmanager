import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Camera, Trash2, Plus, Save, Printer, Edit, ChefHat, ArrowLeft, 
  Loader2, Image, X, Link, Tag, DollarSign
} from 'lucide-react';

// Configuración Supabase
const supabaseUrl = 'https://wqqdhorevqmutqwckkaf.supabase.co';
const supabaseKey = 'sb_publishable_pT0FbySU0ohx4QdFZCeP9w_Cb16gsYM';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Subir a ImgBB
async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  if (!data.success) throw new Error('Error subiendo imagen');
  return data.data.url;
}

const CATEGORIES = ["Pizza", "Entrantes", "Ensaladas", "Platos Calientes", "Postres", "Preparaciones"];

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

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    setLoading(true);
    try {
      const processedSteps = await Promise.all(formData.steps.map(async (step) => {
        if (step.tempImageFile) {
          try {
            const compressed = await compressImage(step.tempImageFile);
            const url = await uploadToImgBB(compressed);
            return { description: step.description, imageUrl: url };
          } catch (error) {
            console.error("Error subiendo:", error);
            return { description: step.description, imageUrl: '' };
          }
        }
        return step;
      }));

      const recipeData = {
        ...formData,
        steps: processedSteps,
        user_id: userId,
        updated_at: new Date().toISOString()
      };

      if (activeRecipe?.id) {
        await supabase.from('recipes').update(recipeData).eq('id', activeRecipe.id);
      } else {
        await supabase.from('recipes').insert([recipeData]);
      }
      
      await loadRecipes();
      setView('list');
    } catch (e) {
      console.error("Error:", e);
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar?')) return;
    try {
      await supabase.from('recipes').delete().eq('id', id);
      await loadRecipes();
      if (activeRecipe?.id === id) setView('list');
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  if (loading && !recipes.length && view === 'list') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('list')}>
            <div className="bg-orange-600 p-2 rounded-lg text-white">
              <ChefHat size={24} />
            </div>
            <h1 className="text-xl font-bold">ChefManager</h1>
          </div>
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-md">
              <ArrowLeft size={16} /> Volver
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        {view === 'list' && (
          <RecipeList 
            recipes={recipes}
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
            onCancel={() => setView('list')}
          />
        )}

        {view === 'view' && activeRecipe && (
          <RecipeViewer 
            recipe={activeRecipe}
            onEdit={() => { setActiveRecipe(activeRecipe); setView('edit'); }}
          />
        )}
      </main>
    </div>
  );
}

function RecipeList({ recipes, onCreate, onSelect, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Fichas</h2>
        <button onClick={onCreate} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Nueva
        </button>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border-dashed border-2">
          <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No hay recetas</h3>
          <button onClick={onCreate} className="text-orange-600 mt-4">Crear ahora</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition group">
              <div className="h-32 bg-slate-100 flex items-center justify-center cursor-pointer" onClick={() => onSelect(recipe)}>
                {recipe.steps?.find(s => s.imageUrl) ? (
                  <img src={recipe.steps.find(s => s.imageUrl).imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                ) : (
                  <Image className="text-slate-300 w-12 h-12" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 cursor-pointer hover:text-orange-600" onClick={() => onSelect(recipe)}>
                  {recipe.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{recipe.description}</p>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    {recipe.yield}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => onEdit(recipe)} className="p-1.5 hover:bg-slate-100 rounded-md text-blue-600">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => onDelete(recipe.id)} className="p-1.5 hover:bg-slate-100 rounded-md text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeEditor({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    category: initialData?.category || 'Platos Calientes',
    description: initialData?.description || '',
    yield: initialData?.yield || '',
    prep_time: initialData?.prep_time || '',
    ingredients: initialData?.ingredients || [{ item: '', quantity: '', unit: '', cost: '' }],
    steps: initialData?.steps || [{ description: '', imageUrl: '' }],
    costing_enabled: initialData?.costing_enabled || false,
    total_cost: initialData?.total_cost || '',
    cost_per_portion: initialData?.cost_per_portion || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const addIngredient = () => {
    setFormData({ ...formData, ingredients: [...formData.ingredients, { item: '', quantity: '', unit: '', cost: '' }] });
  };

  const updateIngredient = (index, field, value) => {
    const newIng = [...formData.ingredients];
    newIng[index] = { ...newIng[index], [field]: value };
    setFormData({ ...formData, ingredients: newIng });
  };

  const removeIngredient = (index) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, { description: '', imageUrl: '' }] });
  };

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

  const removeStep = (index) => {
    setFormData({ ...formData, steps: formData.steps.filter((_, i) => i !== index) });
  };

  useEffect(() => {
    if (formData.costing_enabled) {
      const total = formData.ingredients.reduce((sum, ing) => sum + parseFloat(ing.cost || 0), 0);
      const portions = parseFloat(formData.yield.replace(/[^\d.]/g, '')) || 1;
      setFormData(prev => ({
        ...prev,
        total_cost: total.toFixed(2),
        cost_per_portion: (total / portions).toFixed(2)
      }));
    }
  }, [formData.ingredients, formData.yield, formData.costing_enabled]);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 max-w-4xl mx-auto" onSubmit={handleSubmit}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-xl font-bold">{initialData ? 'Editar' : 'Nueva'} Ficha</h2>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-orange-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={formData.costing_enabled}
            onChange={(e) => setFormData({...formData, costing_enabled: e.target.checked})}
            className="w-5 h-5"
          />
          <DollarSign className="w-5 h-5 text-blue-700" />
          <span className="font-medium text-blue-900">Habilitar Escandallo de Costos</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Nombre del Plato *</label>
          <input 
            required
            type="text" 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Ej: Salmón a la Plancha"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rendimiento</label>
          <input 
            type="text" 
            value={formData.yield} 
            onChange={e => setFormData({...formData, yield: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="4 Porciones"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tiempo</label>
          <input 
            type="text" 
            value={formData.prep_time} 
            onChange={e => setFormData({...formData, prep_time: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="45 min"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-2 border rounded-lg h-20"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-3">Ingredientes</h3>
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border">
          {formData.ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                placeholder="Ingrediente" 
                value={ing.item}
                onChange={e => updateIngredient(idx, 'item', e.target.value)}
                className="flex-grow px-3 py-2 border rounded-md text-sm"
              />
              <input 
                placeholder="Cant." 
                value={ing.quantity}
                onChange={e => updateIngredient(idx, 'quantity', e.target.value)}
                className="w-20 px-3 py-2 border rounded-md text-sm"
              />
              <input 
                placeholder="Unidad" 
                value={ing.unit}
                onChange={e => updateIngredient(idx, 'unit', e.target.value)}
                className="w-20 px-3 py-2 border rounded-md text-sm"
              />
              {formData.costing_enabled && (
                <input 
                  type="number"
                  step="0.01"
                  placeholder="€"
                  value={ing.cost}
                  onChange={e => updateIngredient(idx, 'cost', e.target.value)}
                  className="w-20 px-3 py-2 border rounded-md text-sm"
                />
              )}
              <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500 p-2">
                <X size={18} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addIngredient} className="text-sm text-orange-600 flex items-center gap-1 mt-2">
            <Plus size={16} /> Añadir Ingrediente
          </button>
        </div>

        {formData.costing_enabled && formData.total_cost && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">Costo Total: </span>
              <span className="text-green-900 font-bold">{formData.total_cost}€</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Costo/Porción: </span>
              <span className="text-green-900 font-bold">{formData.cost_per_portion}€</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-3">Preparación</h3>
        <div className="space-y-6">
          {formData.steps.map((step, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg relative group">
              <div className="flex-none w-full md:w-40 h-40 bg-slate-100 rounded-lg overflow-hidden relative border">
                {step.imageUrl ? (
                  <img src={step.imageUrl} alt={`Paso ${idx + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Camera className="text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Sin foto</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-xs">
                  <Camera size={24} className="mb-1" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleImageSelect(idx, e.target.files[0])} />
                </label>
              </div>

              <div className="flex-grow">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-bold text-slate-500">PASO {idx + 1}</span>
                  <button type="button" onClick={() => removeStep(idx)} className="text-slate-300 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
                <textarea 
                  value={step.description}
                  onChange={e => updateStep(idx, e.target.value)}
                  placeholder="Describe este paso..."
                  className="w-full h-28 px-3 py-2 border rounded-md text-sm resize-none"
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={addStep} className="w-full py-3 border-2 border-dashed rounded-lg text-slate-500 hover:border-orange-500 hover:text-orange-600 flex justify-center items-center gap-2">
            <Plus size={20} /> Añadir Paso
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipeViewer({ recipe, onEdit }) {
  return (
    <div className="bg-white shadow-lg max-w-4xl mx-auto rounded-xl overflow-hidden">
      <div className="bg-slate-50 border-b p-4 flex justify-end gap-3">
        <button onClick={onEdit} className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2">
          <Edit size={16} /> Editar
        </button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2">
          <Printer size={16} /> PDF
        </button>
      </div>

      <div className="p-8 md:p-12">
        <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{recipe.title}</h1>
              {recipe.category && (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full font-medium">
                  {recipe.category}
                </span>
              )}
            </div>
            <p className="text-lg text-slate-600 italic">{recipe.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-sm">
            <div className="bg-slate-100 px-3 py-1 rounded">
              <span className="font-bold">Rendimiento:</span> {recipe.yield}
            </div>
            {recipe.prep_time && (
              <div className="bg-slate-100 px-3 py-1 rounded">
                <span className="font-bold">Tiempo:</span> {recipe.prep_time}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="font-bold text-lg text-orange-800 uppercase mb-4 border-b border-orange-200 pb-2">
                Ingredientes
              </h3>
              <ul className="space-y-3 text-sm">
                {recipe.ingredients?.map((ing, i) => (
                  <li key={i} className="flex justify-between border-b border-orange-100 pb-1">
                    <span className="font-medium">{ing.item}</span>
                    <span className="text-slate-600">{ing.quantity} {ing.unit}</span>
                  </li>
                ))}
              </ul>
              {recipe.costing_enabled && recipe.total_cost && (
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex justify-between text-sm font-bold text-orange-900">
                    <span>Total:</span>
                    <span>{recipe.total_cost}€</span>
                  </div>
                  <div className="flex justify-between text-xs text-orange-700 mt-1">
                    <span>Por porción:</span>
                    <span>{recipe.cost_per_portion}€</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-bold text-lg text-slate-900 uppercase mb-6 border-b border-slate-200 pb-2">
              Procedimiento
            </h3>
            <div className="space-y-8">
              {recipe.steps?.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-none flex flex-col items-center">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-sm mb-2">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">
                      {step.description}
                    </p>
                    {step.imageUrl && (
                      <div className="w-48 h-32 rounded-lg overflow-hidden border">
                        <img src={step.imageUrl} alt={`Paso ${i+1}`} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}