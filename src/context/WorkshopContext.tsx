'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AddExtraRepairInput,
  ApprovalStatus,
  CreateOrderInput,
  OrderStatus,
  WorkOrder,
} from '@/types/workshop';
import { getInitialMockOrders } from '@/data/mock-orders';
import {
  addExtraRepair,
  createWorkOrder,
  respondBudgetBase,
  respondExtraRepair,
  setBudgetBase,
  updateOrderStatus,
} from '@/lib/workshop-engine';

const STORAGE_KEY = 'tallertrack_orders_v1';

interface WorkshopContextValue {
  orders: WorkOrder[];
  activeOrder: WorkOrder;
  activeOrderId: string;
  selectOrder: (orderId: string) => void;
  registerOrder: (input: CreateOrderInput) => WorkOrder;
  changeOrderStatus: (orderId: string, status: OrderStatus) => void;
  submitBudgetBase: (
    orderId: string,
    description: string,
    amount: number
  ) => void;
  decideBudgetBase: (
    orderId: string,
    decision: Exclude<ApprovalStatus, 'pending'>
  ) => void;
  submitExtraRepair: (orderId: string, input: AddExtraRepairInput) => void;
  decideExtraRepair: (
    orderId: string,
    extraId: string,
    decision: Exclude<ApprovalStatus, 'pending'>
  ) => void;
  resetDemoData: () => void;
}

const WorkshopContext = createContext<WorkshopContextValue | undefined>(
  undefined
);

export function WorkshopProvider({
  children,
  initialOrders,
}: {
  children: React.ReactNode;
  initialOrders?: WorkOrder[];
}) {
  const [orders, setOrders] = useState<WorkOrder[]>(
    () => initialOrders ?? getInitialMockOrders()
  );
  const [activeOrderId, setActiveOrderId] = useState<string>(
    () => (initialOrders ?? getInitialMockOrders())[0]?.order_id ?? 'ORD-101'
  );

  // Hidratación desde localStorage sólo si no se inyectaron initialOrders en tests
  useEffect(() => {
    if (initialOrders) return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkOrder[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
          setActiveOrderId(parsed[0].order_id);
        }
      }
    } catch {
      // Ignorar errores de localStorage
    }
  }, [initialOrders]);

  // Guardar en localStorage y sincronizar entre pestañas
  useEffect(() => {
    if (initialOrders) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // Ignorar errores de localStorage
    }
  }, [orders, initialOrders]);

  useEffect(() => {
    if (initialOrders) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as WorkOrder[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
          }
        } catch {
          // Ignorar
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [initialOrders]);

  const selectOrder = useCallback((orderId: string) => {
    setActiveOrderId(orderId);
  }, []);

  const registerOrder = useCallback(
    (input: CreateOrderInput): WorkOrder => {
      const nextNum = 101 + orders.length;
      const newOrder = createWorkOrder(input, `ORD-${nextNum}`);
      setOrders((prev) => [newOrder, ...prev]);
      setActiveOrderId(newOrder.order_id);
      return newOrder;
    },
    [orders.length]
  );

  const changeOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? updateOrderStatus(order, status) : order
        )
      );
    },
    []
  );

  const submitBudgetBase = useCallback(
    (orderId: string, description: string, amount: number) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId
            ? setBudgetBase(order, description, amount)
            : order
        )
      );
    },
    []
  );

  const decideBudgetBase = useCallback(
    (orderId: string, decision: Exclude<ApprovalStatus, 'pending'>) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? respondBudgetBase(order, decision) : order
        )
      );
    },
    []
  );

  const submitExtraRepair = useCallback(
    (orderId: string, input: AddExtraRepairInput) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? addExtraRepair(order, input) : order
        )
      );
    },
    []
  );

  const decideExtraRepair = useCallback(
    (
      orderId: string,
      extraId: string,
      decision: Exclude<ApprovalStatus, 'pending'>
    ) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId
            ? respondExtraRepair(order, extraId, decision)
            : order
        )
      );
    },
    []
  );

  const resetDemoData = useCallback(() => {
    const fresh = getInitialMockOrders();
    setOrders(fresh);
    setActiveOrderId(fresh[0].order_id);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignorar
    }
  }, []);

  const activeOrder = useMemo(() => {
    return (
      orders.find((order) => order.order_id === activeOrderId) ?? orders[0]
    );
  }, [orders, activeOrderId]);

  const value = useMemo(
    () => ({
      orders,
      activeOrder,
      activeOrderId: activeOrder.order_id,
      selectOrder,
      registerOrder,
      changeOrderStatus,
      submitBudgetBase,
      decideBudgetBase,
      submitExtraRepair,
      decideExtraRepair,
      resetDemoData,
    }),
    [
      orders,
      activeOrder,
      selectOrder,
      registerOrder,
      changeOrderStatus,
      submitBudgetBase,
      decideBudgetBase,
      submitExtraRepair,
      decideExtraRepair,
      resetDemoData,
    ]
  );

  return (
    <WorkshopContext.Provider value={value}>
      {children}
    </WorkshopContext.Provider>
  );
}

export function useWorkshop(): WorkshopContextValue {
  const ctx = useContext(WorkshopContext);
  if (!ctx) {
    throw new Error('useWorkshop debe usarse dentro de un WorkshopProvider');
  }
  return ctx;
}
