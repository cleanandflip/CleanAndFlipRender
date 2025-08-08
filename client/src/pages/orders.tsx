import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UnifiedDropdown } from "@/components/ui/unified-dropdown";
import { Card } from "@/components/ui/card";
import { Package, Search, Calendar, Truck, ArrowLeft } from "lucide-react";
import { useState } from "react";
import type { Order } from "@shared/schema";

// Mock user data - replace with actual auth
const mockUser = {
  id: "temp-user-id",
};

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/orders", { userId: mockUser.id }],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'processing': return 'bg-purple-500';
      case 'shipped': return 'bg-green-500';
      case 'delivered': return 'bg-green-600';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Calendar size={16} />;
      case 'confirmed': return <Package size={16} />;
      case 'processing': return <Package size={16} />;
      case 'shipped': return <Truck size={16} />;
      case 'delivered': return <Package size={16} />;
      default: return <Package size={16} />;
    }
  };

  // Filter and sort orders
  const filteredOrders = (orders || [])
    .filter((order: Order) => {
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: Order, b: Order) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
        case 'oldest':
          return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
        case 'amount-high':
          return Number(b.total) - Number(a.total);
        case 'amount-low':
          return Number(a.total) - Number(b.total);
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-glass-bg rounded"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-glass-bg rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-32 px-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Orders</h1>
            <p className="text-text-secondary">Please try again later.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-bebas text-4xl md:text-6xl mb-2">ORDER HISTORY</h1>
            <p className="text-text-secondary">
              Track your orders and view purchase history
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="glass border-border">
              <ArrowLeft className="mr-2" size={18} />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search by order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass border-border pl-10"
              />
            </div>

            {/* Status Filter */}
            <UnifiedDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by status"
              options={[
                { value: "all", label: "All Orders" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "processing", label: "Processing" },
                { value: "shipped", label: "Shipped" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" }
              ]}
            />

            {/* Sort */}
            <UnifiedDropdown
              value={sortBy}
              onChange={setSortBy}
              placeholder="Sort by"
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "amount-high", label: "Amount: High to Low" },
                { value: "amount-low", label: "Amount: Low to High" }
              ]}
            />

            {/* Results Count */}
            <div className="flex items-center text-sm text-text-secondary">
              {filteredOrders.length} of {(orders || []).length} orders
            </div>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="mx-auto mb-6 text-gray-400" size={64} />
            <h2 className="text-2xl font-semibold mb-4">
              {(orders || []).length === 0 ? "No orders yet" : "No orders found"}
            </h2>
            <p className="text-text-secondary mb-8">
              {(orders || []).length === 0 
                ? "Start shopping to see your order history here."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {(orders || []).length === 0 ? (
              <Link href="/products">
                <Button className="bg-accent-blue hover:bg-blue-500">
                  Browse Products
                </Button>
              </Link>
            ) : (
              <Button onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }} className="bg-accent-blue hover:bg-blue-500">
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order: Order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(order.status || 'pending')} text-white`}>
                      {getStatusIcon(order.status || 'pending')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Order #{order.id.slice(-8)}</h3>
                      <p className="text-text-secondary text-sm">
                        Placed on {new Date(order.createdAt!).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold">${order.total}</div>
                    <Badge className={`${getStatusColor(order.status || 'pending')} text-white mt-1`}>
                      {(order.status || 'pending').replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-text-muted">Subtotal:</span>
                    <span className="ml-2 font-medium">${order.subtotal}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Shipping:</span>
                    <span className="ml-2 font-medium">${order.shipping}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Tax:</span>
                    <span className="ml-2 font-medium">${order.tax}</span>
                  </div>
                </div>

                {/* Tracking Number */}
                {order.trackingNumber && (
                  <div className="mb-4 p-3 glass rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tracking Number:</span>
                      <code className="text-accent-blue font-mono text-sm">{order.trackingNumber}</code>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Link href={`/orders/${order.id}`}>
                    <Button className="bg-accent-blue hover:bg-blue-500">
                      View Details
                    </Button>
                  </Link>
                  
                  {order.status === 'delivered' && (
                    <Button variant="outline" className="glass border-border">
                      Reorder
                    </Button>
                  )}
                  
                  {order.status === 'shipped' && order.trackingNumber && (
                    <Button variant="outline" className="glass border-border">
                      Track Package
                    </Button>
                  )}
                  
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <Button variant="outline" className="glass border-border text-red-400 border-red-400">
                      Cancel Order
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button (if needed for pagination) */}
        {filteredOrders.length >= 20 && (
          <div className="mt-8 text-center">
            <Button variant="outline" className="glass border-border">
              Load More Orders
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
