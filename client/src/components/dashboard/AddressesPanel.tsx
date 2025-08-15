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
import { LocalBadge } from "@/components/locality/LocalBadge";
import { isLocalZip } from "@shared/locality";

export default function AddressesPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<null | any>(null);
  const { toast } = useToast();
  
  // Maximum address limit
  const MAX_ADDRESSES = 2;

  const { data: addresses = [], isLoading, isError, error } = useQuery({
    queryKey: ["/api/addresses"],
    staleTime: 5 * 60 * 1000,
  });

  const handleCreateOrUpdate = async (payload: any) => {
    try {
      // Check address limit for new addresses
      if (!editing?.id && addresses.length >= MAX_ADDRESSES) {
        toast({
          title: "Address limit reached",
          description: `You can only have ${MAX_ADDRESSES} addresses. Delete an existing address to add a new one.`,
          variant: "destructive",
        });
        return;
      }

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
        qc.invalidateQueries({ queryKey: ["/api/user"] }),
        qc.invalidateQueries({ queryKey: ["locality"] })
      ]);
      
      // Dispatch events to trigger immediate locality updates
      // Use React Query invalidation instead of window events that can trigger reloads
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['addresses'] }),
        qc.invalidateQueries({ queryKey: ['cart'] }),
        qc.invalidateQueries({ queryKey: ['user'] }),
      ]);
      // Keep event for backward compatibility but avoid reload triggers
      window.dispatchEvent(new CustomEvent('defaultAddressChanged', { detail: { id } }));
      window.dispatchEvent(new CustomEvent('addressUpdated', { detail: { id } }));
      
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

  const isAtMaxLimit = addresses.length >= MAX_ADDRESSES;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-bebas text-2xl">SAVED ADDRESSES</h2>
          {isAtMaxLimit && (
            <p className="text-sm text-amber-400 mt-1">
              Maximum addresses limit reached ({addresses.length}/{MAX_ADDRESSES})
            </p>
          )}
        </div>
        <Button 
          onClick={() => {
            if (isAtMaxLimit) {
              toast({
                title: "Address limit reached",
                description: `You can only have ${MAX_ADDRESSES} addresses. Delete an existing address to add a new one.`,
                variant: "destructive",
              });
              return;
            }
            setEditing(null);
            setOpen(true);
          }} 
          disabled={isAtMaxLimit}
          className={isAtMaxLimit ? "opacity-50 cursor-not-allowed" : ""}
          data-testid="button-add-address"
        >
          Add New Address
        </Button>
      </div>

      {/* Address limit warning */}
      {isAtMaxLimit && (
        <Alert className="mb-6 border-amber-500 bg-amber-500/10 text-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            You have reached the maximum of {MAX_ADDRESSES} saved addresses. To add a new address, please delete an existing one first.
          </AlertDescription>
        </Alert>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold mb-2">No addresses yet</h3>
          <p className="text-text-secondary mb-4">
            Add addresses to make checkout faster.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            You can save up to {MAX_ADDRESSES} addresses.
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
          <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
            <span>{addresses.length} of {MAX_ADDRESSES} addresses used</span>
          </div>
          {addresses.map((address: any) => (
            <div key={address.id} className={`p-4 glass rounded-lg transition-all relative ${
              address.isDefault 
                ? 'border-2 border-blue-400 bg-blue-950/40 ring-1 ring-blue-400/30' 
                : 'border border-border hover:border-gray-600'
            }`}>
              {address.isDefault && (
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">
                      {address.firstName} {address.lastName}
                    </h3>
                    <LocalBadge isLocal={isLocalZip(address.postalCode)} />
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {address.street1}<br />
                    {address.city}, {address.state} {address.postalCode}
                  </p>
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