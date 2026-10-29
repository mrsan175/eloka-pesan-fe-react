import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, CircleCheck, CircleX } from 'lucide-react';
import { Card } from '@/components/ui';
import { isShopOpen } from '@/lib/utils';
import type { Shop } from '@/types';

interface ShopCardProps {
  shop: Shop;
  variant?: 'vertical' | 'horizontal';
}

const ShopCard = ({ shop, variant = 'vertical' }: ShopCardProps) => {
  const navigate = useNavigate();
  const open = isShopOpen(shop);
  const statusLabel = open ? 'Buka' : 'Tutup';
  const statusClassName = open
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-500 border-slate-200';

  const handleClick = () => {
    navigate(`/shops/${shop.id}`);
  };

  if (variant === 'horizontal') {
    return (
      <Card
        onClick={handleClick}
        hoverable
        className={`flex gap-4 p-3 overflow-hidden ${!open ? 'opacity-75 grayscale-[0.35]' : ''}`}
      >
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary-100">
          <img
            src={shop.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60'}
            alt={shop.name}
            className="w-full h-full object-cover"
          />
          {!open && <div className="absolute inset-0 bg-slate-900/20" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-secondary-900 truncate">
              {shop.name}
            </h3>
            <p className="text-xs text-secondary-500 line-clamp-1 mt-0.5">
              {shop.description}
            </p>
            <span className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClassName}`}>
              {open ? <CircleCheck size={11} /> : <CircleX size={11} />}
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-secondary-600">
            {shop.rating && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={14} fill="currentColor" />
                <span className="font-medium text-secondary-700">
                  {shop.rating.toFixed(1)}
                </span>
              </div>
            )}
            {shop.distance !== undefined && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{shop.distance.toFixed(1)} km</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>
                {shop.openTime} - {shop.closeTime}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
    onClick={handleClick}
    hoverable
    className={`overflow-hidden p-0 ${!open ? 'opacity-75 grayscale-[0.35]' : ''}`}
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-secondary-100">
        <img
          src={shop.logoUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60'}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
        {!open && <div className="absolute inset-0 bg-slate-900/20" />}
        {shop.rating && (
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold text-secondary-900 shadow-sm">
            <Star size={12} className="text-yellow-500" fill="currentColor" />
            <span>{shop.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-secondary-900 truncate">
          {shop.name}
        </h3>
        <p className="text-xs text-secondary-500 line-clamp-1 mt-0.5">
          {shop.address}
        </p>
        <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClassName}`}>
          {open ? <CircleCheck size={11} /> : <CircleX size={11} />}
          {statusLabel}
        </span>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-secondary-100 text-xs text-secondary-600">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>
              {shop.openTime} - {shop.closeTime}
            </span>
          </div>
          {shop.distance !== undefined && (
            <div className="flex items-center gap-1 font-medium text-primary-600">
              <MapPin size={12} />
              <span>{shop.distance.toFixed(1)} km</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ShopCard;