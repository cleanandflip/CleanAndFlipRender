import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AddressForm from "@/components/addresses/AddressForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/shared/AnimatedComponents";
import { AlertCircle, MapPin, Edit, CheckCircle, Truck, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddressesPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | any>(null);
  const { toast } = useToast();

  const { data: addresses = [], isLoading, isError, error } = useQuery({
    queryKey: ["/api/addresses"],
    staleTime: 5 * 60 * 1000,
  });

  const handleCreateOrUpdate = async (payload: any) => {
    try {
      if (editing?.id) {
        await apiRequest("PUT", `/api/addresses/${editing.id}`, payload);
      } else {
        await apiRequest("POST", "/api/addresses", payload);
      }
      setOpen(false);
      setEditing(null);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["/api/addresses"] }),
        qc.invalidateQueries({ queryKey: ["/api/user"] })
      ]);
      toast({
        title: "Success",
        description: editing ? "Address updated successfully" : "Address added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/addresses/${id}`);
      await qc.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const handleMakeDefault = async (id: string) => {
    try {
      await apiRequest("POST", `/api/addresses/${id}/default`);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["/api/addresses"] }),
        qc.invalidateQueries({ queryKey: ["/api/user"] })
      ]);
      toast({
        title: "Success",
        description: "Default address updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set default address",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/addresses/${id}`);
      await qc.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({
        title: "Success",
        description: "Address deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load addresses: {String((error as any)?.message || error)}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
          <p className="text-text-secondary mt-4">Loading addresses...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bebas text-2xl">SAVED ADDRESSES</h2>
        <Button onClick={() => {
          setEditing(null);
          setOpen(true);
        }} data-testid="button-add-address">
          Add New Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold mb-2">No addresses yet</h3>
          <p className="text-text-secondary mb-6">
            Add addresses to make checkout faster.
          </p>
          <Button onClick={() => {
            setEditing(null);
            setOpen(true);
          }} data-testid="button-add-address-empty">
            Add Address
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address: any) => (
            <div key={address.id} className={`p-4 glass rounded-lg transition-all ${
              address.isDefault 
                ? 'border-2 border-accent-blue bg-gradient-to-r from-blue-900/10 to-transparent' 
                : 'border border-border hover:border-gray-600'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">
                      {address.firstName} {address.lastName}
                    </h3>
                    {address.isDefault && (
                      <Badge className="bg-accent-blue text-white text-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Default
                      </Badge>
                    )}
                    {address.isLocal && (
                      <Badge className="bg-green-600 text-white text-xs flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Local Delivery
                      </Badge>
                    )}
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {address.street1}<br />
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  {address.isLocal && (
                    <p className="text-green-400 text-sm mt-2">
                      ✓ Free local delivery to your doorstep in Asheville area
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      setEditing(address);
                      setOpen(true);
                    }}
                    data-testid={`button-edit-address-${address.id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  {!address.isDefault && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleMakeDefault(address.id)}
                        data-testid={`button-make-default-${address.id}`}
                      >
                        Make Default
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs text-red-400 hover:text-red-300 hover:border-red-400"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this address?')) {
                            handleDelete(address.id);
                          }
                        }}
                        data-testid={`button-delete-address-${address.id}`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                  {address.isDefault && (
                    <span className="text-xs text-gray-500 px-3 py-1.5 italic">
                      Default (cannot delete)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <AddressForm
          defaultValues={editing ?? undefined}
          onCancel={() => { 
            setOpen(false); 
            setEditing(null); 
          }}
          onSuccess={() => {
            setOpen(false);
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["/api/addresses"] });
          }}
        />
      )}
    </Card>
  );
}