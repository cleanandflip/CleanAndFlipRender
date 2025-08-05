import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ruler, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { Size, Brand, Category } from "@shared/schema";

const SIZE_TYPES = [
  { value: 'numeric', label: 'Numeric (6, 7, 8, 9...)' },
  { value: 'letter', label: 'Letter (XS, S, M, L, XL...)' },
  { value: 'custom', label: 'Custom (32x34, 42R...)' },
  { value: 'one_size', label: 'One Size Fits All' }
];

interface SizeFormData {
  brandId: string;
  categoryId: string;
  sizeType: 'numeric' | 'letter' | 'custom' | 'one_size';
  value: string;
  displayName: string;
  sortOrder: number;
  measurements: {
    length?: number;
    width?: number;
    height?: number;
    chest?: number;
    waist?: number;
    inseam?: number;
  };
  isActive: boolean;
}

export function SizeManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState<SizeFormData>({
    brandId: '',
    categoryId: '',
    sizeType: 'numeric',
    value: '',
    displayName: '',
    sortOrder: 0,
    measurements: {},
    isActive: true
  });

  const queryClient = useQueryClient();

  const { data: sizes = [], isLoading } = useQuery({
    queryKey: ['/api/sizes'],
    queryFn: () => apiRequest('/api/sizes')
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['/api/brands', { active: true }],
    queryFn: () => apiRequest('/api/brands?active=true')
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories', { active: true }],
    queryFn: () => apiRequest('/api/categories?active=true')
  });

  const createSizeMutation = useMutation({
    mutationFn: (data: SizeFormData) => apiRequest('/api/sizes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sizes'] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "Success",
        description: "Size created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create size",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      brandId: '',
      categoryId: '',
      sizeType: 'numeric',
      value: '',
      displayName: '',
      sortOrder: 0,
      measurements: {},
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSizeMutation.mutate(formData);
  };

  const filteredSizes = sizes.filter((size: Size) => {
    if (activeTab === "all") return true;
    return size.sizeType === activeTab;
  });

  const getSizeTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'letter': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'custom': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'one_size': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Size Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Size Management
          </CardTitle>
          <Button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Size
          </Button>
        </CardHeader>
        <CardContent>
          {isCreating && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brandId">Brand (Optional)</Label>
                  <Select value={formData.brandId} onValueChange={(value) => setFormData({ ...formData, brandId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a brand..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific brand</SelectItem>
                      {brands.map((brand: Brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoryId">Category (Optional)</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific category</SelectItem>
                      {categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="sizeType">Size Type</Label>
                <Select value={formData.sizeType} onValueChange={(value: any) => setFormData({ ...formData, sizeType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="value">Size Value</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="10, M, 32x34, OS..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Size 10, Medium, 32x34..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              {formData.sizeType === 'custom' && (
                <div className="space-y-3">
                  <Label>Custom Measurements (Optional)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="length" className="text-xs">Length</Label>
                      <Input
                        id="length"
                        type="number"
                        step="0.1"
                        placeholder="inches"
                        onChange={(e) => setFormData({
                          ...formData,
                          measurements: { ...formData.measurements, length: parseFloat(e.target.value) || undefined }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="width" className="text-xs">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        step="0.1"
                        placeholder="inches"
                        onChange={(e) => setFormData({
                          ...formData,
                          measurements: { ...formData.measurements, width: parseFloat(e.target.value) || undefined }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="chest" className="text-xs">Chest</Label>
                      <Input
                        id="chest"
                        type="number"
                        step="0.1"
                        placeholder="inches"
                        onChange={(e) => setFormData({
                          ...formData,
                          measurements: { ...formData.measurements, chest: parseFloat(e.target.value) || undefined }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="waist" className="text-xs">Waist</Label>
                      <Input
                        id="waist"
                        type="number"
                        step="0.1"
                        placeholder="inches"
                        onChange={(e) => setFormData({
                          ...formData,
                          measurements: { ...formData.measurements, waist: parseFloat(e.target.value) || undefined }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="inseam" className="text-xs">Inseam</Label>
                      <Input
                        id="inseam"
                        type="number"
                        step="0.1"
                        placeholder="inches"
                        onChange={(e) => setFormData({
                          ...formData,
                          measurements: { ...formData.measurements, inseam: parseFloat(e.target.value) || undefined }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSize(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createSizeMutation.isPending}
                >
                  Create Size
                </Button>
              </div>
            </form>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All Sizes</TabsTrigger>
              <TabsTrigger value="numeric">Numeric</TabsTrigger>
              <TabsTrigger value="letter">Letter</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
              <TabsTrigger value="one_size">One Size</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredSizes.map((size: any) => (
                  <div
                    key={size.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{size.displayName}</h3>
                        <Badge className={getSizeTypeColor(size.sizeType)}>
                          {size.sizeType.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {size.isActive ? (
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Value: {size.value}</span>
                        {size.brandName && <span>Brand: {size.brandName}</span>}
                        {size.categoryName && <span>Category: {size.categoryName}</span>}
                        <span>Order: {size.sortOrder}</span>
                      </div>

                      {size.measurements && Object.keys(size.measurements).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          <span>Measurements: </span>
                          {Object.entries(size.measurements)
                            .filter(([_, value]) => value)
                            .map(([key, value]) => `${key}: ${value}"`)
                            .join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredSizes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Ruler className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sizes found for this category. Create your first size to get started.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}