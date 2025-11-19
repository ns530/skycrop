import React from 'react';

import { Button } from '../../../shared/ui/Button';

export interface WhatsAppShareButtonProps {
  yieldKgHa: number;
  totalYield: number;
  revenue: number;
  harvestDate: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  yieldKgHa,
  totalYield,
  revenue,
  harvestDate,
}) => {
  const handleShare = () => {
    const message = `🌾 My field yield forecast:\n\n` +
      `• Predicted yield: ${formatNumber(yieldKgHa)} kg/ha\n` +
      `• Total yield: ${formatNumber(totalYield)} kg\n` +
      `• Expected revenue: ${formatCurrency(revenue)}\n` +
      `• Harvest date: ${formatDate(harvestDate)}\n\n` +
      `Powered by SkyCrop`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex justify-center">
      <Button
        size="sm"
        variant="secondary"
        onClick={handleShare}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        📱 Share on WhatsApp
      </Button>
    </div>
  );
};

export default WhatsAppShareButton;