import React, { useState, useRef } from 'react';
import { ArrowRight, Plus, Edit, Trash2, ImagePlus, Save, X } from 'lucide-react';
import MaterialInput from '../components/MaterialInput';
import ConfirmationDialog from '../components/ConfirmationDialog';
import type { BarberContextType, Service } from '../types';
import { MOCK_SERVICES } from '../constants/mockData';

interface ServicesPageProps {
  context: BarberContextType;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ context }) => {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
  const [selectedService, setSelectedService] = useState<Service | 'new' | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  const handleSaveService = (service: Service) => {
    if (selectedService !== 'new' && selectedService?.id) {
        setServices(services.map(s => s.id === service.id ? service : s));
        context.showToast('خدمت با موفقیت ویرایش شد.', 'success');
    } else {
        setServices([...services, { ...service, id: Date.now() }]);
        context.showToast('خدمت جدید اضافه شد.', 'success');
    }
    setSelectedService(null);
  };
  
  const openDeleteDialog = (id: number) => {
    setServiceToDelete(id);
    setDialogOpen(true);
  };

  const handleDeleteService = () => {
    if (serviceToDelete === null) return;
    setServices(services.filter(s => s.id !== serviceToDelete));
    context.showToast('خدمت با موفقیت حذف شد.', 'info');
    setServiceToDelete(null);
  };
  
  if (selectedService) {
    return <AddEditServiceForm 
        service={selectedService === 'new' ? null : selectedService} 
        onSave={handleSaveService} 
        onCancel={() => setSelectedService(null)} 
    />
  }

  return (
    <div className="flex flex-col h-full bg-surface-1">
      <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-50 flex items-center gap-4 border-b border-gray-200">
        <button onClick={() => context.setCurrentPage('profile')} aria-label="بازگشت"><ArrowRight /></button>
        <h1 className="text-2xl font-bold">خدمات و قیمت‌گذاری</h1>
      </header>
      <main className="flex-grow p-4 space-y-3 overflow-y-auto">
        {services.map(service => (
            <div key={service.id} className="bg-white p-3 rounded-lg flex justify-between items-center border shadow-xs">
                <div>
                    <p className="font-bold">{service.name}</p>
                    <p className="text-sm text-gray-700">{service.price.toLocaleString('fa-IR')} تومان - {service.duration} دقیقه</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setSelectedService(service); }} className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"><Edit size={16}/></button>
                    <button onClick={() => openDeleteDialog(service.id)} className="p-2 text-error-600 hover:bg-error-100 rounded-full"><Trash2 size={16}/></button>
                </div>
            </div>
        ))}
        <button onClick={() => setSelectedService('new')} className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition mt-4">
            <Plus size={18}/>
            <span>افزودن خدمت جدید</span>
        </button>
      </main>
       <ConfirmationDialog 
            isOpen={isDialogOpen} 
            onClose={() => setDialogOpen(false)} 
            onConfirm={handleDeleteService}
            title="حذف خدمت"
            isDestructive
        >
            <p>آیا از حذف این خدمت اطمینان دارید؟ این عمل قابل بازگشت نیست.</p>
        </ConfirmationDialog>
    </div>
  );
};

const AddEditServiceForm: React.FC<{ service: Service | null, onSave: (s: Service) => void, onCancel: () => void }> = ({ service, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Service>(service || { id: 0, name: '', price: 0, duration: 0, description: '', isActive: true });
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [sampleImage, setSampleImage] = useState<string | undefined>(service?.description ? undefined : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setSampleImage(previewUrl);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
       <div className="absolute inset-0 bg-surface-1 z-50 flex flex-col">
            <header className="sticky top-0 bg-surface-1/80 backdrop-blur-sm p-4 z-50 flex items-center gap-4 border-b border-gray-200">
                <button onClick={onCancel} aria-label="بازگشت"><ArrowRight /></button>
                <h1 className="text-2xl font-bold">{service?.id ? 'ویرایش خدمت' : 'افزودن خدمت'}</h1>
            </header>
            <main className="flex-grow p-4 overflow-y-auto">
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4">
                         <div className="w-24 h-24 rounded-lg bg-surface-2 flex items-center justify-center overflow-hidden">
                            {sampleImage ? (
                                <img src={sampleImage} alt="نمونه کار" className="w-full h-full object-cover" />
                            ) : (
                                <ImagePlus className="text-gray-400" />
                            )}
                        </div>
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="font-semibold text-primary-600">
                            انتخاب تصویر نمونه
                        </button>
                        <input type="file" ref={imageInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>

                    <MaterialInput id="name" name="name" label="نام خدمت" type="text" value={formData.name} onChange={handleChange} required />
                    <div className="grid grid-cols-2 gap-4">
                        <MaterialInput id="price" name="price" label="قیمت (تومان)" type="number" value={formData.price} onChange={handleChange} required />
                        <MaterialInput id="duration" name="duration" label="مدت (دقیقه)" type="number" value={formData.duration} onChange={handleChange} required />
                    </div>
                    <MaterialInput id="description" name="description" label="توضیحات (اختیاری)" value={formData.description || ''} onChange={handleChange} multiline />
                </form>
            </main>
            <footer className="p-4 border-t border-gray-200 flex gap-2" style={{paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'}}>
                <button type="button" onClick={onCancel} className="flex-1 h-12 bg-gray-200 text-gray-800 font-bold rounded-md flex items-center justify-center gap-1"><X size={18}/>لغو</button>
                <button type="submit" onClick={handleSubmit} className="flex-1 h-12 bg-success-500 text-white font-bold rounded-md flex items-center justify-center gap-1"><Save size={18}/>ذخیره</button>
            </footer>
        </div>
    )
};
