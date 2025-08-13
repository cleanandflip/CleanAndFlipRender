import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AddressPicker({
  addresses,
  currentId,
  onPick
}: {
  addresses: any[];
  currentId?: string | null;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!addresses?.length) return null;

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Change saved address
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="w-[520px] max-w-[92vw] rounded-2xl bg-neutral-900 p-5 shadow-xl">
            <div className="text-lg font-medium mb-4">Choose an address</div>
            <div className="space-y-2 max-h-[50vh] overflow-auto">
              {addresses.map(a => (
                <label key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-black/20">
                  <input
                    type="radio"
                    name="picker"
                    checked={currentId === a.id}
                    onChange={() => onPick(a.id)}
                  />
                  <div className="text-sm">
                    <div className="font-medium">
                      {a.first_name} {a.last_name} 
                      {a.is_default && (
                        <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-green-700/40">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="opacity-80">
                      {a.street}{a.address2 ? `, ${a.address2}` : ""}
                    </div>
                    <div className="opacity-80">
                      {a.city}, {a.state} {a.zipCode}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Use selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}