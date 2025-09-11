'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CreateNewCardProps {
  className?: string;
}

export function CreateNewCard({ className }: CreateNewCardProps) {
  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 border-2 border-dashed border-primary/30 hover:border-primary/60",
      "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
      "h-full min-h-[300px]",
      className
    )}>
      <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center">
        <div className="mb-4 relative">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <Sparkles className="w-4 h-4 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Generate Another Baby
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-48">
          Create a new AI-generated baby prediction with your photos
        </p>
        
        <Link href="/#upload-section" className="w-full">
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </Link>
        
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Upload photos and customize settings
        </div>
      </CardContent>
    </Card>
  );
}