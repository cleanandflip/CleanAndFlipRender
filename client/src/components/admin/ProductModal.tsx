import React from 'react';

export interface ProductModalProps {
  product?: any;
  categories: any[];
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ProductModal({ product, categories, isOpen, onClose, onSave }: ProductModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">
          {product ? 'Edit Product' : 'Create Product'}
        </h3>
        <p className="text-gray-400 mb-6">
          Product editing functionality will be implemented soon.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}