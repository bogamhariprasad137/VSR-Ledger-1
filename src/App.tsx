import React, { useState, useEffect } from "react";
import { 
  Buyer, Supplier, Material, Quotation, Invoice, DashboardNote, BusinessSettings, ActivityLog,
  SupplierLedgerEntry, StockAdjustment, QuoteItem, InvoiceItem, Attachment, BuyerLedgerEntry
} from "./types";
import { 
  LayoutDashboard, Users, Factory, Boxes, FileText, CreditCard, BarChart3, 
  Settings, History, LogOut, Lock, Key, AlertCircle, Sparkles, TrendingUp,
  DollarSign, Clock, CheckCircle2, ChevronRight, Plus, StickyNote, HelpCircle, 
  FileSpreadsheet, RefreshCw, User, Menu, Search, Bell, X, ChevronDown
} from "lucide-react";
import { supabase } from "./lib/supabase";

// Components
import NotesWidget from "./components/NotesWidget";
import BuyersManager from "./components/BuyersManager";
import SuppliersManager from "./components/SuppliersManager";
import InventoryManager from "./components/InventoryManager";
import QuotationsManager from "./components/QuotationsManager";
import InvoicesManager from "./components/InvoicesManager";
import ReportsManager from "./components/ReportsManager";
import SettingsManager from "./components/SettingsManager";

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("pavan_auth") === "true";
  });

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [showForgotMsg, setShowForgotMsg] = useState(false);

  // Active Menu Tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "buyers" | "suppliers" | "inventory" | "quotations" | "invoices" | "reports" | "settings" | "logs"
  >("dashboard");

  // Navigation & Responsiveness States
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isNotesPopupOpen, setIsNotesPopupOpen] = useState<boolean>(false);
  const [isNotifPopupOpen, setIsNotifPopupOpen] = useState<boolean>(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);

  // Handle Android back button or browser back button when mobile menu is open
  useEffect(() => {
    const handlePopState = () => {
      if (isMobileOpen) {
        setIsMobileOpen(false);
        // Prevent going back by pushing current path again
        window.history.pushState(null, "", window.location.pathname);
      }
    };
    if (isMobileOpen) {
      window.history.pushState(null, "", window.location.pathname);
      window.addEventListener("popstate", handlePopState);
    }
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isMobileOpen]);

  // Core Data State
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [buyerLedgerEntries, setBuyerLedgerEntries] = useState<BuyerLedgerEntry[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>({
    companyName: "Pavan Enterprises",
    address: "Plot No. 12, Industrial Area, Sector 4, Gandhinagar, Gujarat, India - 382010",
    phone: "+91 98765 43210",
    email: "info@pavanenterprises.com",
    website: "pavanenterprises.com",
    bankName: "State Bank of India",
    bankAccount: "300412891223",
    bankIfsc: "SBIN0001043",
    gstIn: "24AAACV1234A1Z5",
    defaultGstRate: 18,
    currency: "₹"
  });
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Derived state lists for ledgers & stock histories
  const [supplierLedgerEntries, setSupplierLedgerEntries] = useState<SupplierLedgerEntry[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data on mount
  useEffect(() => {
    let active = true;
    const verifyAndFetch = async () => {
      try {
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            if (active) {
              localStorage.setItem("pavan_auth", "true");
              setIsAuthenticated(true);
              await fetchAllData();
              return;
            }
          }
        }
        
        // Fallback for local session
        if (localStorage.getItem("pavan_auth") === "true") {
          if (active) {
            setIsAuthenticated(true);
            await fetchAllData();
          }
        } else {
          if (active) {
            localStorage.removeItem("pavan_auth");
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        }
      } catch (e) {
        console.error("Auth session sync failed:", e);
        if (localStorage.getItem("pavan_auth") === "true") {
          if (active) {
            setIsAuthenticated(true);
            await fetchAllData();
          }
        } else {
          if (active) {
            localStorage.removeItem("pavan_auth");
            setIsAuthenticated(false);
            setIsLoading(false);
          }
        }
      }
    };

    if (isAuthenticated) {
      verifyAndFetch();
    } else {
      setIsLoading(false);
    }

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [
        buyersRes,
        buyerLedgerRes,
        suppliersRes,
        materialsRes,
        quotesRes,
        invoicesRes,
        notesRes,
        settingsRes,
        logsRes,
        attachmentsRes
      ] = await Promise.all([
        supabase.from("buyers").select("*"),
        supabase.from("buyer_ledger").select("*"),
        supabase.from("suppliers").select("*"),
        supabase.from("materials").select("*"),
        supabase.from("quotations").select("*, quotation_items(*)"),
        supabase.from("invoices").select("*, invoice_items(*), payments(*)"),
        supabase.from("dashboard_notes").select("*"),
        supabase.from("profiles").select("*").limit(1),
        supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }).limit(200),
        supabase.from("invoice_attachments").select("*")
      ]);

      const mappedBuyers = (buyersRes.data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        contactPerson: b.contact_person || "",
        phone: b.phone || "",
        email: b.email || "",
        address: b.address || "",
        gstin: b.gstin || "",
        status: (b.is_active ? "active" : "inactive") as "active" | "inactive",
        balance: Number(b.balance || 0)
      }));

      const mappedBuyerLedger = (buyerLedgerRes.data || []).map((bl: any) => ({
        id: bl.id,
        buyerId: bl.buyer_id,
        date: bl.date,
        type: bl.type,
        referenceId: bl.reference_id,
        description: bl.description || "",
        amount: Number(bl.amount || 0),
        balanceAfter: Number(bl.balance_after || 0)
      }));

      const mappedSuppliers = (suppliersRes.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        contactPerson: s.contact_person || "",
        phone: s.phone || "",
        email: s.email || "",
        address: s.address || "",
        gstin: s.gstin || "",
        status: (s.is_active ? "active" : "inactive") as "active" | "inactive",
        outstandingPayable: Number(s.outstanding_payable || 0)
      }));

      const mappedMaterials = (materialsRes.data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        sku: m.id.substring(0, 8).toUpperCase(),
        category: m.category || "General",
        unit: m.uom || "Kgs",
        defaultPurchaseRate: Number(m.default_purchase_rate || 0),
        defaultSalesRate: Number(m.default_sales_rate || 0),
        minStockLevel: Number(m.minimum_threshold || 0),
        currentStock: Number(m.current_stock || 0)
      }));

      const mappedQuotations = (quotesRes.data || []).map((q: any) => ({
        id: q.id,
        quoteNumber: q.quote_number,
        buyerId: q.buyer_id,
        date: q.date,
        dueDate: q.due_date || "",
        subtotal: Number(q.subtotal || 0),
        taxAmount: Number(q.tax_amount || 0),
        total: Number(q.total || 0),
        status: q.status.toLowerCase() as any,
        notes: q.notes || "",
        items: (q.quotation_items || []).map((it: any) => ({
          materialId: it.material_id,
          name: "Item",
          quantity: Number(it.quantity || 1),
          rate: Number(it.rate || 0),
          amount: Number(it.amount || 0)
        }))
      }));

      const attachmentsMap: Record<string, any[]> = {};
      if (attachmentsRes.data) {
        attachmentsRes.data.forEach((att: any) => {
          const invId = att.invoice_id;
          if (!attachmentsMap[invId]) attachmentsMap[invId] = [];
          attachmentsMap[invId].push({
            id: att.id,
            name: att.file_name,
            fileType: att.mime_type,
            size: att.file_size,
            base64Data: att.file_path,
            uploadedAt: att.uploaded_at
          });
        });
      }

      const mappedInvoices = (invoicesRes.data || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        buyerId: inv.buyer_id,
        date: inv.date,
        dueDate: inv.due_date || "",
        subtotal: Number(inv.subtotal || 0),
        taxAmount: Number(inv.tax_amount || 0),
        total: Number(inv.total || 0),
        balanceDue: Number(inv.total - inv.paid_amount),
        status: (inv.status === "Paid" ? "paid" : (inv.status === "Partially Paid" ? "partial" : "unpaid")) as "paid" | "partial" | "unpaid",
        notes: inv.notes || "",
        transport: inv.transport || null,
        attachments: attachmentsMap[inv.id] || [],
        items: (inv.invoice_items || []).map((it: any) => ({
          materialId: it.material_id,
          name: "Item",
          quantity: Number(it.quantity || 1),
          rate: Number(it.rate || 0),
          taxRate: Number(it.tax_rate || 18),
          amount: Number(it.subtotal || 0),
          taxAmount: Number(it.tax_amount || 0),
          total: Number(it.total || 0),
          transportationAmount: Number(it.transportation_amount || 0)
        })),
        payments: (inv.payments || []).map((p: any) => ({
          id: p.id,
          date: p.date,
          amount: Number(p.amount || 0),
          method: p.payment_method,
          referenceNo: p.reference_number || "",
          notes: p.remarks || ""
        }))
      }));

      const mappedNotes = (notesRes.data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.description || "",
        isPinned: n.is_pinned || false,
        isCompleted: n.is_completed || false,
        category: n.category || "General",
        createdAt: n.created_at
      }));

      if (settingsRes.data && settingsRes.data[0]) {
        const s = settingsRes.data[0];
        setSettings({
          companyName: s.company_name,
          address: s.address,
          phone: s.phone,
          email: s.email,
          website: "",
          gstIn: s.gstin,
          bankName: s.bank_name,
          bankAccount: s.bank_account,
          bankIfsc: s.bank_ifsc,
          upiId: s.upi_id || "",
          qrCodeUrl: s.qr_code_url || "",
          logoUrl: s.company_logo_url || "",
          invoiceFooter: s.invoice_footer || "",
          termsConditions: s.terms_conditions || "",
          currency: s.currency || "₹",
          defaultGstRate: Number(s.default_gst_rate || 18)
        });
      }

      const mappedLogs = (logsRes.data || []).map((l: any) => ({
        id: l.id,
        timestamp: l.timestamp,
        action: l.action,
        module: l.module,
        referenceId: l.reference_id || "",
        details: l.details || ""
      }));

      setBuyers(mappedBuyers);
      setBuyerLedgerEntries(mappedBuyerLedger);
      setSuppliers(mappedSuppliers);
      setMaterials(mappedMaterials);
      setQuotations(mappedQuotations);
      setInvoices(mappedInvoices);
      setNotes(mappedNotes);
      setLogs(mappedLogs);

      deriveSubLedgers(mappedSuppliers, mappedMaterials, mappedInvoices);
    } catch (err) {
      console.error("Failed to fetch server database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to derive chronological historical logs
  const deriveSubLedgers = (sups: Supplier[], mats: Material[], invs: Invoice[]) => {
    // 1. Supplier ledger logs
    const supEntries: SupplierLedgerEntry[] = [];
    sups.forEach(s => {
      // Opening balance
      supEntries.push({
        id: `op-${s.id}`,
        supplierId: s.id,
        date: "2026-01-01",
        type: "opening",
        referenceId: "OP-001",
        description: "Opening Outstanding Liability Balance",
        amount: s.outstandingPayable,
        balanceAfter: s.outstandingPayable
      });
    });
    setSupplierLedgerEntries(supEntries);

    // 2. Stock logs
    const adjustments: StockAdjustment[] = [];
    mats.forEach(m => {
      adjustments.push({
        id: `init-${m.id}`,
        materialId: m.id,
        date: "2026-01-01",
        type: "reconcile",
        quantity: m.currentStock,
        description: "Initial Catalog Registration Audit Count"
      });
    });

    // Subdispatches from invoices
    invs.forEach(inv => {
      inv.items.forEach(it => {
        adjustments.push({
          id: `disp-${inv.id}-${it.materialId}`,
          materialId: it.materialId,
          date: inv.date,
          type: "remove",
          quantity: it.quantity,
          description: `Dispatched on Sales Billing: ${inv.invoiceNumber}`
        });
      });
    });

    setStockAdjustments(adjustments);
  };

  const verifyAndCheckLocalSession = () => {
    const localAuth = localStorage.getItem("pavan_auth");
    if (localAuth === "true") {
      setIsAuthenticated(true);
      fetchAllData();
    } else {
      setIsLoading(false);
    }
  };

  const handleLogin = async (password: string, email: string) => {
    setIsLoggingIn(true);
    setAuthError("");
    try {
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) {
            console.warn("Supabase Auth failed, checking local credentials:", error.message);
          } else if (data.session) {
            localStorage.setItem("pavan_auth", "true");
            setIsAuthenticated(true);
            setAuthError("");
            return;
          }
        } catch (supErr) {
          console.warn("Supabase connection failed, checking local fallback:", supErr);
        }
      }

      // Local fallback bypass credentials
      if (email.trim() === "admin@pavanenterprises.com" && password === "admin123") {
        localStorage.setItem("pavan_auth", "true");
        setIsAuthenticated(true);
        setAuthError("");
      } else {
        setAuthError("Invalid credentials. Try using admin@pavanenterprises.com / admin123");
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "An unexpected network error occurred.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(password, email);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setAuthError("Please enter your email address to reset password.");
      return;
    }
    setIsResetting(true);
    setAuthError("");
    setResetSuccess("");
    try {
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setResetSuccess("Password reset link sent to your email.");
      } else {
        // Local fallback simulation
        if (email.trim() === "admin@pavanenterprises.com") {
          setResetSuccess("Password reset link sent to admin email (Local fallback mode).");
        } else {
          setAuthError("User not found.");
        }
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setAuthError(err.message || "Failed to send password reset email.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error("SignOut error:", e);
    } finally {
      // Immediately clear local state or localStorage caching
      try {
        localStorage.clear();
      } catch (err) {
        console.error("Failed to clear localStorage:", err);
      }
      
      setIsAuthenticated(false);
      setBuyers([]);
      setBuyerLedgerEntries([]);
      setSuppliers([]);
      setMaterials([]);
      setQuotations([]);
      setInvoices([]);
      setNotes([]);
      setLogs([]);
      setSupplierLedgerEntries([]);
      setStockAdjustments([]);

      // Force a clean application redirect or window reload back to the root path
      window.location.href = "/";
    }
  };


  // --- API Mutators ---
  const saveLogs = async (action: string, module: string, details: string) => {
    if (!supabase) return;
    try {
      const newLog = {
        action,
        module,
        details,
        timestamp: new Date().toISOString()
      };
      await supabase.from("activity_logs").insert([newLog]);
      
      const { data: logsData } = await supabase.from("activity_logs").select("*").order("timestamp", { ascending: false }).limit(200);
      setLogs((logsData || []).map((l: any) => ({
        id: l.id,
        timestamp: l.timestamp,
        action: l.action,
        module: l.module,
        referenceId: l.reference_id || "",
        details: l.details || ""
      })));
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Settings
  const handleSaveSettings = async (updatedSettings: {
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessGstin: string;
    gstRate: number;
    currency: string;
    qrCodeUrl?: string;
  }) => {
    if (!supabase) return;
    try {
      const payload = {
        company_name: updatedSettings.businessName,
        address: updatedSettings.businessAddress,
        phone: updatedSettings.businessPhone,
        gstin: updatedSettings.businessGstin,
        default_gst_rate: updatedSettings.gstRate,
        currency: updatedSettings.currency,
        qr_code_url: updatedSettings.qrCodeUrl !== undefined ? updatedSettings.qrCodeUrl : settings.qrCodeUrl,
        updated_at: new Date().toISOString()
      };

      await supabase.from("profiles").upsert({
        id: "00000000-0000-0000-0000-000000000000",
        ...payload
      });

      setSettings((prev: any) => ({
        ...prev,
        companyName: updatedSettings.businessName,
        address: updatedSettings.businessAddress,
        phone: updatedSettings.businessPhone,
        gstIn: updatedSettings.businessGstin,
        defaultGstRate: updatedSettings.gstRate,
        currency: updatedSettings.currency,
        qrCodeUrl: updatedSettings.qrCodeUrl !== undefined ? updatedSettings.qrCodeUrl : settings.qrCodeUrl
      }));
      saveLogs("Update", "Settings", "Updated global business parameters and tax ratios");
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Buyers CRUD
  const handleAddBuyer = async (buyerData: Omit<Buyer, "id">) => {
    if (!supabase) return;
    try {
      const gstinVal = buyerData.gstin?.trim();
      const cleanedGstin = !gstinVal || gstinVal.toUpperCase() === "N/A" ? null : gstinVal;

      const newBuyerRow = {
        name: buyerData.name,
        contact_person: buyerData.contactPerson || "",
        phone: buyerData.phone || "",
        email: buyerData.email || "",
        address: buyerData.address || "",
        gstin: cleanedGstin,
        balance: Number(buyerData.balance) || 0,
        is_active: buyerData.status !== "inactive"
      };

      const { data: inserted, error } = await supabase.from("buyers").insert([newBuyerRow]).select();
      if (error) throw new Error(error.message);

      if (inserted && inserted[0] && Number(buyerData.balance) !== 0) {
        await supabase.from("buyer_ledger").insert([{
          buyer_id: inserted[0].id,
          date: new Date().toISOString().split("T")[0],
          type: "opening",
          reference_id: "opening",
          amount: Number(buyerData.balance),
          description: "Opening Ledger Balance",
          balance_after: Number(buyerData.balance)
        }]);
      }

      await fetchAllData();
      saveLogs("Create", "Buyers", `Registered client account ${buyerData.name}`);
      showToast(`Successfully registered buyer: ${buyerData.name}`, "success");
    } catch (e: any) {
      console.error("Failed to add buyer:", e);
      showToast(e.message || "Failed to add buyer.", "error");
    }
  };

  const handleUpdateBuyer = async (id: string, updates: Partial<Buyer>) => {
    if (!supabase) return;
    try {
      const { data: prevData } = await supabase.from("buyers").select("balance").eq("id", id).single();
      const prevBalance = Number(prevData?.balance || 0);

      const mappedUpdates: any = {};
      if (updates.name !== undefined) mappedUpdates.name = updates.name;
      if (updates.contactPerson !== undefined) mappedUpdates.contact_person = updates.contactPerson;
      if (updates.phone !== undefined) mappedUpdates.phone = updates.phone;
      if (updates.email !== undefined) mappedUpdates.email = updates.email;
      if (updates.address !== undefined) mappedUpdates.address = updates.address;
      if (updates.gstin !== undefined) {
        const gstinVal = updates.gstin?.trim();
        mappedUpdates.gstin = !gstinVal || gstinVal.toUpperCase() === "N/A" ? null : gstinVal;
      }
      if (updates.status !== undefined) mappedUpdates.is_active = updates.status !== "inactive";
      if (updates.balance !== undefined) mappedUpdates.balance = Number(updates.balance);

      const { error } = await supabase.from("buyers").update(mappedUpdates).eq("id", id);
      if (error) throw new Error(error.message);

      if (updates.balance !== undefined && Number(updates.balance) !== prevBalance) {
        await supabase.from("buyer_ledger").insert([{
          buyer_id: id,
          date: new Date().toISOString().split("T")[0],
          type: "opening",
          reference_id: "adjustment",
          amount: Number(updates.balance) - prevBalance,
          description: `Manual balance reconciliation (Was: ${prevBalance}, Adjusted to: ${updates.balance})`,
          balance_after: Number(updates.balance)
        }]);
      }

      await fetchAllData();
      saveLogs("Update", "Buyers", `Modified company details for ${updates.name || id}`);
      showToast("Buyer details updated successfully.", "success");
    } catch (e: any) {
      console.error("Failed to update buyer:", e);
      showToast(e.message || "Failed to update buyer.", "error");
    }
  };

  const handleDeleteBuyer = async (id: string) => {
    if (!supabase) return;
    try {
      const { data: invs } = await supabase.from("invoices").select("id, total, paid_amount").eq("buyer_id", id);
      const hasInvoices = invs?.some(inv => Number(inv.total) - Number(inv.paid_amount) > 0);
      if (hasInvoices) {
        throw new Error("Cannot delete buyer with pending outstanding balances.");
      }

      const { error } = await supabase.from("buyers").delete().eq("id", id);
      if (error) throw new Error(error.message);

      await fetchAllData();
      saveLogs("Delete", "Buyers", `Purged client account ID ${id}`);
      showToast("Buyer deleted successfully.", "success");
    } catch (e: any) {
      console.error("Failed to delete buyer:", e);
      showToast(e.message || "Failed to delete buyer.", "error");
    }
  };

  // 3. Suppliers CRUD
  const handleAddSupplier = async (supData: Omit<Supplier, "id">) => {
    if (!supabase) return;
    try {
      const gstinVal = supData.gstin?.trim();
      const cleanedGstin = !gstinVal || gstinVal.toUpperCase() === "N/A" ? null : gstinVal;

      const newSup = {
        name: supData.name,
        contact_person: supData.contactPerson || "",
        phone: supData.phone || "",
        email: supData.email || "",
        address: supData.address || "",
        gstin: cleanedGstin,
        outstanding_payable: Number(supData.outstandingPayable) || 0,
        is_active: supData.status !== "inactive"
      };

      const { data: inserted } = await supabase.from("suppliers").insert([newSup]).select();
      if (inserted && inserted[0] && Number(supData.outstandingPayable) !== 0) {
        await supabase.from("supplier_ledger").insert([{
          supplier_id: inserted[0].id,
          date: new Date().toISOString().split("T")[0],
          type: "opening",
          reference_id: "opening",
          amount: Number(supData.outstandingPayable),
          description: "Opening Purchase Balance Outstanding",
          balance_after: Number(supData.outstandingPayable)
        }]);
      }
      await fetchAllData();
      saveLogs("Create", "Suppliers", `Registered raw material vendor ${supData.name}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!supabase) return;
    try {
      const { data: prevData } = await supabase.from("suppliers").select("outstanding_payable").eq("id", id).single();
      const prevPayable = Number(prevData?.outstanding_payable || 0);

      const mappedUpdates: any = {};
      if (updates.name !== undefined) mappedUpdates.name = updates.name;
      if (updates.contactPerson !== undefined) mappedUpdates.contact_person = updates.contactPerson;
      if (updates.phone !== undefined) mappedUpdates.phone = updates.phone;
      if (updates.email !== undefined) mappedUpdates.email = updates.email;
      if (updates.address !== undefined) mappedUpdates.address = updates.address;
      if (updates.gstin !== undefined) {
        const gstinVal = updates.gstin?.trim();
        mappedUpdates.gstin = !gstinVal || gstinVal.toUpperCase() === "N/A" ? null : gstinVal;
      }
      if (updates.status !== undefined) mappedUpdates.is_active = updates.status !== "inactive";
      if (updates.outstandingPayable !== undefined) mappedUpdates.outstanding_payable = Number(updates.outstandingPayable);

      await supabase.from("suppliers").update(mappedUpdates).eq("id", id);

      if (updates.outstandingPayable !== undefined && Number(updates.outstandingPayable) !== prevPayable) {
        await supabase.from("supplier_ledger").insert([{
          supplier_id: id,
          date: new Date().toISOString().split("T")[0],
          type: "opening",
          reference_id: "adjustment",
          amount: Number(updates.outstandingPayable) - prevPayable,
          description: `Manual outstanding ledger adjustment (Was: ${prevPayable}, Adjusted to: ${updates.outstandingPayable})`,
          balance_after: Number(updates.outstandingPayable)
        }]);
      }

      await fetchAllData();
      saveLogs("Update", "Suppliers", `Modified supplier parameters for ${updates.name || id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from("suppliers").delete().eq("id", id);
      await fetchAllData();
      saveLogs("Delete", "Suppliers", `Removed vendor partner ID ${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Material Inventory CRUD
  const handleAddMaterial = async (matData: Omit<Material, "id">) => {
    if (!supabase) return;
    try {
      const newMat = {
        name: matData.name,
        category: matData.category || "General",
        uom: matData.unit || "Kgs",
        default_purchase_rate: Number(matData.defaultPurchaseRate) || 0,
        default_sales_rate: Number(matData.defaultSalesRate) || 0,
        current_stock: Number(matData.currentStock) || 0,
        minimum_threshold: Number(matData.minStockLevel) || 10
      };

      const { data: inserted } = await supabase.from("materials").insert([newMat]).select();
      if (inserted && inserted[0] && Number(matData.currentStock) > 0) {
        await supabase.from("inventory_transactions").insert([{
          material_id: inserted[0].id,
          date: new Date().toISOString().split("T")[0],
          type: "add",
          quantity: Number(matData.currentStock),
          description: "Initial material creation stock setup"
        }]);
      }
      await fetchAllData();
      saveLogs("Create", "Inventory", `Added material ${matData.name} to catalogue`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMaterial = async (id: string, updates: Partial<Material>) => {
    if (!supabase) return;
    try {
      const { data: prevData } = await supabase.from("materials").select("current_stock").eq("id", id).single();
      const prevStock = Number(prevData?.current_stock || 0);

      const mapped: any = {};
      if (updates.name !== undefined) mapped.name = updates.name;
      if (updates.category !== undefined) mapped.category = updates.category;
      if (updates.unit !== undefined) mapped.uom = updates.unit;
      if (updates.defaultPurchaseRate !== undefined) mapped.default_purchase_rate = Number(updates.defaultPurchaseRate);
      if (updates.defaultSalesRate !== undefined) mapped.default_sales_rate = Number(updates.defaultSalesRate);
      if (updates.minStockLevel !== undefined) mapped.minimum_threshold = Number(updates.minStockLevel);
      if (updates.currentStock !== undefined) mapped.current_stock = Number(updates.currentStock);

      await supabase.from("materials").update(mapped).eq("id", id);

      if (updates.currentStock !== undefined && Number(updates.currentStock) !== prevStock) {
        const diff = Number(updates.currentStock) - prevStock;
        await supabase.from("inventory_transactions").insert([{
          material_id: id,
          date: new Date().toISOString().split("T")[0],
          type: diff > 0 ? "add" : "remove",
          quantity: Math.abs(diff),
          description: `Direct manual stock catalog edit reconciliation (Was: ${prevStock}, Adjusted to: ${updates.currentStock})`
        }]);
      }
      await fetchAllData();
      saveLogs("Update", "Inventory", `Updated parameters for material catalog spec ${updates.name || id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from("materials").delete().eq("id", id);
      await fetchAllData();
      saveLogs("Delete", "Inventory", `Removed item ID ${id} from catalog`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdjustStock = async (id: string, adj: { type: "add" | "remove" | "reconcile"; quantity: number; description: string }) => {
    if (!supabase) return;
    try {
      const { data: current } = await supabase.from("materials").select("current_stock").eq("id", id).single();
      const prevStock = Number(current?.current_stock || 0);
      let newStock = prevStock;

      if (adj.type === "add") {
        newStock += Number(adj.quantity);
      } else if (adj.type === "remove") {
        newStock = Math.max(0, newStock - Number(adj.quantity));
      } else if (adj.type === "reconcile") {
        newStock = Number(adj.quantity);
      }

      await supabase.from("materials").update({ current_stock: newStock }).eq("id", id);
      await supabase.from("inventory_transactions").insert([{
        material_id: id,
        date: new Date().toISOString().split("T")[0],
        type: adj.type,
        quantity: Number(adj.quantity),
        description: adj.description || "Manual reconciliation adjustment"
      }]);

      await fetchAllData();
      saveLogs("Adjustment", "Inventory", `Adjusted stock for item ${id}: ${adj.type} ${adj.quantity} units`);
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Quotation CRUD
  const handleAddQuotation = async (qData: Omit<Quotation, "id" | "quoteNumber">) => {
    if (!supabase) return;
    try {
      const subtotal = qData.items.reduce((sum, it) => sum + (Number(it.rate) * Number(it.quantity)), 0);
      const taxAmount = Math.round(subtotal * (settings.defaultGstRate / 100));
      const total = subtotal + taxAmount;

      const { data: inserted, error } = await supabase.from("quotations").insert([{
        buyer_id: qData.buyerId,
        date: qData.date || new Date().toISOString().split("T")[0],
        due_date: qData.dueDate || null,
        subtotal,
        tax_amount: taxAmount,
        total,
        status: "Draft",
        notes: qData.notes || null
      }]).select();
      if (error) throw new Error(error.message);

      if (inserted && inserted[0]) {
        const itemRows = qData.items.map(it => ({
          quotation_id: inserted[0].id,
          material_id: it.materialId,
          quantity: Number(it.quantity),
          rate: Number(it.rate),
          amount: Number(it.quantity) * Number(it.rate)
        }));
        await supabase.from("quotation_items").insert(itemRows);
      }

      await fetchAllData();
      saveLogs("Create", "Quotations", "Drafted custom deal quotation sheet");
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateQuotation = async (id: string, updates: Partial<Quotation>) => {
    if (!supabase) return;
    try {
      const statusMap: Record<string, string> = {
        draft: "Draft",
        sent: "Sent",
        approved: "Approved",
        declined: "Declined",
        converted: "Converted"
      };
      const mapped: any = {};
      if (updates.status !== undefined) mapped.status = statusMap[updates.status] || updates.status;
      if (updates.notes !== undefined) mapped.notes = updates.notes;
      if (updates.dueDate !== undefined) mapped.due_date = updates.dueDate;

      if (updates.items !== undefined) {
        const subtotal = updates.items.reduce((sum, it) => sum + (Number(it.rate) * Number(it.quantity)), 0);
        const taxAmount = Math.round(subtotal * (settings.defaultGstRate / 100));
        const total = subtotal + taxAmount;
        mapped.subtotal = subtotal;
        mapped.tax_amount = taxAmount;
        mapped.total = total;

        await supabase.from("quotation_items").delete().eq("quotation_id", id);
        const itemRows = updates.items.map(it => ({
          quotation_id: id,
          material_id: it.materialId,
          quantity: Number(it.quantity),
          rate: Number(it.rate),
          amount: Number(it.quantity) * Number(it.rate)
        }));
        await supabase.from("quotation_items").insert(itemRows);
      }

      await supabase.from("quotations").update(mapped).eq("id", id);
      await fetchAllData();
      saveLogs("Update", "Quotations", `Modified quotation ${id} status to ${updates.status}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvertQuotation = async (id: string) => {
    if (!supabase) return;
    try {
      const { data: qData } = await supabase.from("quotations").select("*, quotation_items(*)").eq("id", id).single();
      if (!qData) throw new Error("Quotation not found");

      const invoiceRow = {
        buyer_id: qData.buyer_id,
        date: new Date().toISOString().split("T")[0],
        due_date: qData.due_date || null,
        subtotal: Number(qData.subtotal),
        tax_amount: Number(qData.tax_amount),
        total: Number(qData.total),
        paid_amount: 0,
        status: "Unpaid",
        notes: `Converted from quotation ${qData.quote_number}`
      };

      const { data: insertedInv, error: invError } = await supabase.from("invoices").insert([invoiceRow]).select();
      if (invError) throw new Error(invError.message);

      if (insertedInv && insertedInv[0]) {
        const invoiceItems = qData.quotation_items.map((it: any) => ({
          invoice_id: insertedInv[0].id,
          material_id: it.material_id,
          quantity: Number(it.quantity),
          rate: Number(it.rate),
          tax_rate: settings.defaultGstRate,
          subtotal: Number(it.amount),
          tax_amount: Math.round(Number(it.amount) * (settings.defaultGstRate / 100)),
          total: Number(it.amount) + Math.round(Number(it.amount) * (settings.defaultGstRate / 100)),
          transportation_amount: 0
        }));
        await supabase.from("invoice_items").insert(invoiceItems);

        const { data: bData } = await supabase.from("buyers").select("balance").eq("id", qData.buyer_id).single();
        const newBalance = Number(bData?.balance || 0) + Number(qData.total);
        await supabase.from("buyers").update({ balance: newBalance }).eq("id", qData.buyer_id);

        await supabase.from("buyer_ledger").insert([{
          buyer_id: qData.buyer_id,
          date: new Date().toISOString().split("T")[0],
          type: "invoice",
          reference_id: insertedInv[0].id,
          amount: Number(qData.total),
          description: `Invoice billing generated: ${insertedInv[0].invoice_number}`,
          balance_after: newBalance
        }]);
      }

      await supabase.from("quotations").update({ status: "Converted" }).eq("id", id);
      await fetchAllData();
      saveLogs("Convert", "Quotations", `Converted quotation ${id} to active Invoice`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from("quotations").delete().eq("id", id);
      await fetchAllData();
      saveLogs("Delete", "Quotations", `Removed proposal quotation ID ${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Invoices CRUD
  const handleAddInvoice = async (invData: Omit<Invoice, "id" | "invoiceNumber">) => {
    if (!supabase) return;
    try {
      const subtotal = invData.items.reduce((sum, it) => sum + (Number(it.rate) * Number(it.quantity)), 0);
      const item_level_transportation = invData.items.reduce((sum, it) => sum + Number(it.transportation_amount || 0), 0);
      const global_transportation = invData.transport ? Math.max(0, Number(invData.transport.amount || 0)) : 0;
      const total_transportation = item_level_transportation + global_transportation;
      const taxAmount = Math.round(subtotal * (settings.defaultGstRate / 100));
      const total = subtotal + taxAmount + total_transportation;
      const invoiceDate = invData.date || new Date().toISOString().split("T")[0];

      const invoiceRow = {
        buyer_id: invData.buyerId,
        date: invoiceDate,
        due_date: invData.dueDate || null,
        subtotal,
        tax_amount: taxAmount,
        total,
        paid_amount: 0,
        status: "Unpaid",
        notes: invData.notes || null,
        transport: invData.transport ? {
          supplierId: invData.transport.supplierId || null,
          amount: Math.max(0, Number(invData.transport.amount || 0)),
          notes: invData.transport.notes || ""
        } : null
      };

      const { data: insertedInv, error: invError } = await supabase.from("invoices").insert([invoiceRow]).select();
      if (invError) throw new Error(invError.message);

      if (insertedInv && insertedInv[0]) {
        const itemRows = invData.items.map(it => {
          const qty = Number(it.quantity);
          const rate = Number(it.rate);
          const transAmt = Number(it.transportation_amount || 0);
          const purchase_rate = Number(it.purchase_rate || 0);
          const sellingAmount = qty * rate;
          const purchaseAmount = qty * purchase_rate;
          const profit = sellingAmount - purchaseAmount - transAmt;
          const margin_percentage = sellingAmount > 0 ? (profit / sellingAmount) * 100 : 0;

          return {
            invoice_id: insertedInv[0].id,
            material_id: it.materialId,
            quantity: qty,
            rate: rate,
            tax_rate: settings.defaultGstRate,
            subtotal: sellingAmount,
            tax_amount: Math.round(sellingAmount * (settings.defaultGstRate / 100)),
            total: sellingAmount + Math.round(sellingAmount * (settings.defaultGstRate / 100)) + transAmt,
            transportation_amount: transAmt,
            transport_supplier_id: it.transport_supplier_id || null,
            transportation_notes: it.transportation_notes || "",
            purchase_rate: purchase_rate,
            selling_rate: rate,
            profit: profit,
            margin_percentage: Math.round(margin_percentage * 100) / 100
          };
        });
        await supabase.from("invoice_items").insert(itemRows);

        const { data: bData } = await supabase.from("buyers").select("balance").eq("id", invData.buyerId).single();
        const newBalance = Number(bData?.balance || 0) + total;
        await supabase.from("buyers").update({ balance: newBalance }).eq("id", invData.buyerId);

        await supabase.from("buyer_ledger").insert([{
          buyer_id: invData.buyerId,
          date: invoiceDate,
          type: "invoice",
          reference_id: insertedInv[0].id,
          amount: total,
          description: `Invoice billing generated: ${insertedInv[0].invoice_number}`,
          balance_after: newBalance
        }]);
      }

      await fetchAllData();
      saveLogs("Create", "Invoices", "Logged active sales invoice & dispatched stock items");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPayment = async (id: string, payment: { amount: number; method: string; referenceNo?: string; notes?: string }) => {
    if (!supabase) return;
    try {
      const targetInvoice = invoices.find(inv => inv.id === id);
      if (!targetInvoice) throw new Error("Invoice not found");

      const newPayment = {
        invoice_id: id,
        buyer_id: targetInvoice.buyerId,
        amount: Number(payment.amount),
        payment_method: payment.method,
        reference_number: payment.referenceNo || null,
        remarks: payment.notes || null,
        date: new Date().toISOString().split("T")[0]
      };

      const { error } = await supabase.from("payments").insert([newPayment]);
      if (error) throw new Error(error.message);

      await fetchAllData();
      saveLogs("Payment", "Invoices", `Cleared outstanding ${settings.currency}${payment.amount} using ${payment.method} on invoice ${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAttachment = async (id: string, attachment: Omit<Attachment, "id" | "uploadedAt">) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from("invoice_attachments").insert([{
        invoice_id: id,
        file_name: attachment.name,
        file_path: attachment.base64Data,
        file_size: attachment.size || 0,
        mime_type: attachment.fileType || "application/octet-stream"
      }]);
      if (error) throw new Error(error.message);

      await fetchAllData();
      saveLogs("Attachment", "Invoices", `Uploaded custom document attachment to invoice ${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicateInvoice = async (id: string) => {
    if (!supabase) return;
    try {
      const { data: inv, error: fetchErr } = await supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).single();
      if (fetchErr || !inv) throw new Error("Source invoice not found");

      const invoiceRow = {
        buyer_id: inv.buyer_id,
        date: new Date().toISOString().split("T")[0],
        due_date: inv.due_date || null,
        subtotal: Number(inv.subtotal),
        tax_amount: Number(inv.tax_amount),
        total: Number(inv.total),
        paid_amount: 0,
        status: "Unpaid",
        notes: `Duplicated from invoice ${inv.invoice_number}`,
        transport: inv.transport || null
      };

      const { data: inserted, error: invError } = await supabase.from("invoices").insert([invoiceRow]).select();
      if (invError) throw new Error(invError.message);

      if (inserted && inserted[0]) {
        const itemRows = inv.invoice_items.map((it: any) => ({
          invoice_id: inserted[0].id,
          material_id: it.material_id,
          quantity: Number(it.quantity),
          rate: Number(it.rate),
          tax_rate: Number(it.tax_rate),
          subtotal: Number(it.subtotal),
          tax_amount: Number(it.tax_amount),
          total: Number(it.total),
          transportation_amount: Number(it.transportation_amount),
          transport_supplier_id: it.transport_supplier_id || null,
          transportation_notes: it.transportation_notes || "",
          purchase_rate: Number(it.purchase_rate),
          selling_rate: Number(it.selling_rate),
          profit: Number(it.profit),
          margin_percentage: Number(it.margin_percentage)
        }));
        await supabase.from("invoice_items").insert(itemRows);

        const { data: bData } = await supabase.from("buyers").select("balance").eq("id", inv.buyer_id).single();
        const newBalance = Number(bData?.balance || 0) + Number(inv.total);
        await supabase.from("buyers").update({ balance: newBalance }).eq("id", inv.buyer_id);

        await supabase.from("buyer_ledger").insert([{
          buyer_id: inv.buyer_id,
          date: new Date().toISOString().split("T")[0],
          type: "invoice",
          reference_id: inserted[0].id,
          amount: Number(inv.total),
          description: `Duplicated Invoice billing generated: ${inserted[0].invoice_number}`,
          balance_after: newBalance
        }]);
      }

          await fetchAllData();
          saveLogs("Duplicate", "Invoices", `Duplicated invoice ${inv.invoice_number} to new sheet`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!supabase) return;
    try {
      const { data: inv } = await supabase.from("invoices").select("*, invoice_items(*)").eq("id", id).single();
      if (!inv) throw new Error("Invoice not found");

      const balanceDue = Number(inv.total) - Number(inv.paid_amount);

      const { data: bData } = await supabase.from("buyers").select("balance").eq("id", inv.buyer_id).single();
      const newBalance = Math.max(0, Number(bData?.balance || 0) - balanceDue);
      await supabase.from("buyers").update({ balance: newBalance }).eq("id", inv.buyer_id);

      await supabase.from("buyer_ledger").insert([{
        buyer_id: inv.buyer_id,
        date: new Date().toISOString().split("T")[0],
        type: "opening",
        reference_id: "deletion",
        amount: balanceDue,
        description: `Invoice deletion reversal: ${inv.invoice_number}`,
        balance_after: newBalance
      }]);

      for (const it of inv.invoice_items) {
        const { data: mat } = await supabase.from("materials").select("current_stock").eq("id", it.material_id).single();
        const newStock = Number(mat?.current_stock || 0) + Number(it.quantity);
        await supabase.from("materials").update({ current_stock: newStock }).eq("id", it.material_id);
        await supabase.from("inventory_transactions").insert([{
          material_id: it.material_id,
          date: new Date().toISOString().split("T")[0],
          type: "add",
          quantity: Number(it.quantity),
          description: `Restored stock on Invoice Deletion: ${inv.invoice_number}`
        }]);
      }

      await supabase.from("invoices").delete().eq("id", id);
      await fetchAllData();
      saveLogs("Delete", "Invoices", `Purged invoice ID ${id}, reversed balance, and restored stock balance`);
    } catch (e) {
      console.error(e);
    }
  };

  // 7. Notes CRUD
  const handleAddNote = async (noteData: Omit<DashboardNote, "id" | "createdAt">) => {
    if (!supabase) return;
    try {
      await supabase.from("dashboard_notes").insert([{
        title: noteData.title,
        description: noteData.content || "",
        is_pinned: noteData.isPinned || false,
        is_completed: noteData.isCompleted || false,
        category: noteData.category || "General"
      }]);
      await fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateNote = async (id: string, updates: Partial<DashboardNote>) => {
    if (!supabase) return;
    try {
      const mapped: any = {};
      if (updates.title !== undefined) mapped.title = updates.title;
      if (updates.content !== undefined) mapped.description = updates.content;
      if (updates.isPinned !== undefined) mapped.is_pinned = updates.isPinned;
      if (updates.isCompleted !== undefined) mapped.is_completed = updates.isCompleted;
      if (updates.category !== undefined) mapped.category = updates.category;

      await supabase.from("dashboard_notes").update(mapped).eq("id", id);
      await fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!supabase) return;
    try {
      await supabase.from("dashboard_notes").delete().eq("id", id);
      await fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // 8. Wipe
  const handleWipeDatabase = async () => {
    if (!supabase) return;
    try {
      await supabase.from("buyer_ledger").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("supplier_ledger").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("inventory_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("invoice_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("quotation_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("quotations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("dashboard_notes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("buyers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("suppliers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("materials").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("activity_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      await fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  // --- Financial Dashboard calculations ---
  const todaySales = (() => {
    const today = new Date().toISOString().split("T")[0];
    return invoices
      .filter(inv => inv.date === today)
      .reduce((sum, inv) => sum + inv.total, 0);
  })();

  const monthlySales = (() => {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    return invoices
      .filter(inv => inv.date.startsWith(currentMonth))
      .reduce((sum, inv) => sum + inv.total, 0);
  })();

  const totalOutstandingReceivables = buyers.reduce((sum, b) => sum + b.balance, 0);
  const totalOutstandingPayables = suppliers.reduce((sum, s) => sum + s.outstandingPayable, 0);
  const grossSalesTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);

  // Quick Action Wizards
  const triggerQuickInvoice = () => {
    setActiveTab("invoices");
  };

  const triggerQuickQuote = () => {
    setActiveTab("quotations");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-milky flex flex-col items-center justify-center font-sans text-xs">
        <div className="p-8 text-center glass-card rounded-2xl max-w-sm space-y-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="font-bold text-charcoal uppercase tracking-widest text-[10px]">Verifying Pavan Ledger Vault...</p>
          <p className="text-stone font-semibold leading-relaxed">Reading persistent local disk database blocks. Please wait.</p>
        </div>
      </div>
    );
  }

  // AUTH WALL GUEST SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-milky flex flex-col items-center justify-center p-4 font-sans text-xs">
        <div className="glass-card max-w-sm w-full overflow-hidden rounded-2xl">
          {/* Header */}
          <div className="p-6 bg-primary text-card-soft text-center flex flex-col items-center justify-center space-y-2">
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDqjlC1GmAQ71cveIBWJUQbgaI23as2k9VstUR_Pbujx7VstUR_Pbujx7Vf0kVtguzY04&s=10" 
              alt="Pavan Logo"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full border border-card-soft/20 shadow-md object-cover"
            />
            <div>
              <h1 className="text-xl font-bold font-display uppercase tracking-widest text-card-soft">PAVAN LEDGER</h1>
              <p className="text-[10px] text-card-soft/80 font-medium">Secure Admin Single-User Micro ERP portal</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {authError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-stone uppercase mb-1">Email Address</label>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/60" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@pavanenterprises.com" 
                  className="w-full pl-9 pr-3 py-2 border border-border-sand bg-card-soft/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-charcoal text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone uppercase mb-1">Admin Access Password</label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/60" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-9 pr-3 py-2 border border-border-sand bg-card-soft/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-charcoal text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end text-[10px] pt-1">
              <button 
                type="button" 
                disabled={isResetting}
                onClick={handleResetPassword}
                className="text-primary-dark hover:underline disabled:opacity-50 font-bold"
              >
                {isResetting ? "Sending..." : "Forgot Password?"}
              </button>
            </div>

            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark disabled:bg-primary/70 text-card-soft font-bold rounded-lg shadow-md uppercase tracking-wider text-xs transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Ledger Credentials"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // COMPILATION LAYOUT
  return (
    <div className="min-h-screen bg-background-milky flex font-sans text-xs antialiased print:bg-white overflow-hidden">
      
      {/* Mobile Drawer Backdrop overlay */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-charcoal/40 backdrop-blur-xs z-40 transition-opacity duration-300"
        />
      )}

      {/* Responsive Left Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0 transition-all duration-300 ease-in-out bg-primary border-r border-black/5 text-card-soft flex flex-col justify-between p-4 shrink-0 no-print shadow-xl md:shadow-none h-full
          ${isMobileOpen ? "translate-x-0 w-[80%] sm:w-[280px]" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-[72px]" : "md:w-[280px]"}
        `}
      >
        {/* Top Section: Branding, Logo and Collapse Trigger */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-card-soft/10">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="bg-card-soft p-1 rounded-xl text-primary shadow-sm font-bold shrink-0 transition-transform hover:scale-[1.05] hover:rotate-3 duration-200 overflow-hidden">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDqjlC1GmAQ71cveIBWJUQbgaI23as2k9VstUR_Pbujx7Vf0kVtguzY04&s=10" 
                  alt="Pavan Logo"
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-lg object-cover"
                />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="min-w-0 flex-1 animate-fade-in">
                  <h2 className="font-extrabold tracking-widest text-[12px] font-display uppercase text-card-soft">PAVAN LEDGER</h2>
                  <p className="text-[9px] text-card-soft/75 font-medium truncate">{settings.companyName}</p>
                </div>
              )}
            </div>
            
            {/* Collapse button for md/lg displays */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1 bg-card-soft/10 hover:bg-card-soft/20 rounded-lg text-card-soft transition-all duration-200"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>

          {/* Navigation List */}
          <p className={`px-2 text-[8px] font-extrabold tracking-widest text-card-soft/50 uppercase ${isCollapsed && !isMobileOpen ? "text-center" : ""}`}>
            {isCollapsed && !isMobileOpen ? "Menu" : "General Options"}
          </p>

          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "buyers", label: "Buyers", icon: Users },
              { id: "suppliers", label: "Suppliers", icon: Factory },
              { id: "invoices", label: "Invoices", icon: CreditCard },
              { id: "quotations", label: "Quotations", icon: FileText },
              { id: "inventory", label: "Raw Material Inventory", icon: Boxes },
              { id: "catalog", label: "Material Catalog", icon: FileSpreadsheet },
              { id: "reports", label: "Reports", icon: BarChart3 },
              { id: "settings", label: "Settings", icon: Settings }
            ].map(item => {
              const IconComp = item.icon;
              const isSelected = activeTab === item.id || (item.id === "catalog" && activeTab === "inventory");

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => {
                      if (item.id === "catalog") {
                        setActiveTab("inventory");
                      } else {
                        setActiveTab(item.id as any);
                      }
                      setIsMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left group hover:scale-[1.01] hover:-translate-y-[0.5px] duration-200 relative ${
                      isSelected 
                        ? "bg-[#D4C9BA] text-[#1C1C1E] shadow-sm font-extrabold" 
                        : "text-[#D4C9BA]/85 hover:text-[#D4C9BA] hover:bg-[rgba(212,201,186,0.15)]"
                    }`}
                  >
                    {/* Left Accent indicator for active item */}
                    {isSelected && (
                      <div className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-[#1C1C1E] rounded-r-md animate-pulse" />
                    )}

                    <IconComp className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 duration-200" />
                    
                    {(!isCollapsed || isMobileOpen) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>

                  {/* Tooltip for collapsed mode on md screens */}
                  {isCollapsed && !isMobileOpen && (
                    <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-charcoal text-[#D4C9BA] text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Add with collapsible menu in sidebar */}
            <div className="relative group border-t border-card-soft/10 pt-2 mt-2">
              <button
                onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all text-left text-card-soft/85 hover:text-card-soft hover:bg-[rgba(212,201,186,0.15)] hover:scale-[1.01] duration-200`}
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-4 h-4 shrink-0 bg-[#D4C9BA]/20 p-0.5 rounded-full" />
                  {(!isCollapsed || isMobileOpen) && <span>Quick Add</span>}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isQuickAddOpen ? "rotate-180" : ""}`} />
                )}
              </button>

              {/* Collapsed menu mini float or inline list */}
              {isCollapsed && !isMobileOpen ? (
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-charcoal text-[#D4C9BA] text-[9px] font-extrabold p-2 rounded-xl shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 flex flex-col gap-1.5 pointer-events-auto">
                  <p className="border-b border-card-soft/15 pb-1 mb-1 text-[#D4C9BA]/60">Quick Actions</p>
                  <button onClick={() => { setActiveTab("invoices"); setIsMobileOpen(false); }} className="hover:text-[#D4C9BA]/80 transition-colors text-left font-bold text-[9px]">+ Invoice</button>
                  <button onClick={() => { setActiveTab("quotations"); setIsMobileOpen(false); }} className="hover:text-[#D4C9BA]/80 transition-colors text-left font-bold text-[9px]">+ Quotation</button>
                  <button onClick={() => { setActiveTab("buyers"); setIsMobileOpen(false); }} className="hover:text-[#D4C9BA]/80 transition-colors text-left font-bold text-[9px]">+ Buyer</button>
                  <button onClick={() => { setActiveTab("suppliers"); setIsMobileOpen(false); }} className="hover:text-[#D4C9BA]/80 transition-colors text-left font-bold text-[9px]">+ Supplier</button>
                </div>
              ) : (
                isQuickAddOpen && (
                  <div className="pl-6 pr-2 py-1.5 space-y-1 animate-fade-in flex flex-col gap-0.5">
                    <button 
                      onClick={() => { setActiveTab("invoices"); }}
                      className="w-full text-left text-[10px] py-1 text-card-soft/85 hover:text-card-soft font-bold flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4C9BA]" /> New Invoice
                    </button>
                    <button 
                      onClick={() => { setActiveTab("quotations"); }}
                      className="w-full text-left text-[10px] py-1 text-card-soft/85 hover:text-card-soft font-bold flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4C9BA]" /> New Quotation
                    </button>
                    <button 
                      onClick={() => { setActiveTab("buyers"); }}
                      className="w-full text-left text-[10px] py-1 text-card-soft/85 hover:text-card-soft font-bold flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4C9BA]" /> New Buyer
                    </button>
                    <button 
                      onClick={() => { setActiveTab("suppliers"); }}
                      className="w-full text-left text-[10px] py-1 text-card-soft/85 hover:text-card-soft font-bold flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4C9BA]" /> New Supplier
                    </button>
                  </div>
                )
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Section: Admin Profile Card */}
        <div className={`mt-auto border-t border-card-soft/10 pt-4 ${isCollapsed && !isMobileOpen ? "flex flex-col items-center gap-3" : "space-y-3"}`}>
          <div className={`flex items-center ${isCollapsed && !isMobileOpen ? "justify-center" : "gap-3"} min-w-0`}>
            {/* Avatar initials badge */}
            <div className="w-9 h-9 rounded-full bg-[#D4C9BA] text-[#1C1C1E] font-extrabold flex items-center justify-center text-xs border border-white/10 shadow-sm shrink-0">
              AD
            </div>
            
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 flex-1 animate-fade-in">
                <h4 className="font-extrabold text-[11px] text-card-soft leading-none truncate">Admin Owner</h4>
                <p className="text-[9px] text-card-soft/75 mt-1 leading-none truncate font-medium">{settings.companyName}</p>
              </div>
            )}
          </div>

          {(!isCollapsed || isMobileOpen) ? (
            <button 
              onClick={handleLogout}
              className="w-full py-1.5 bg-card-soft/15 hover:bg-card-soft/25 text-card-soft font-bold rounded-xl flex items-center justify-center gap-1.5 text-[10px] transition-all duration-200 active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out Session
            </button>
          ) : (
            <button 
              onClick={handleLogout}
              className="p-2 bg-card-soft/15 hover:bg-card-soft/25 text-card-soft font-bold rounded-xl flex items-center justify-center transition-all duration-200 active:scale-[0.98]"
              title="Log Out Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top App Bar Header with Search, Memos, and Notifications popups */}
        <header className="h-14 bg-primary border-b border-white/10 text-card-soft flex items-center justify-between px-5 shrink-0 no-print z-30 relative shadow-md">
          <div className="flex items-center gap-3">
            {/* ☰ Burger Menu trigger on mobile */}
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-1.5 hover:bg-white/10 rounded-lg text-card-soft transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5 text-card-soft" />
            </button>

            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-card-soft text-sm uppercase tracking-wider font-display">
                {activeTab === "dashboard" ? "Control Dashboard" :
                 activeTab === "buyers" ? "Buyers Ledger" :
                 activeTab === "suppliers" ? "Suppliers Ledger" :
                 activeTab === "inventory" ? "Material Catalog" :
                 activeTab === "quotations" ? "Quotations Sheet" :
                 activeTab === "invoices" ? "Tax Invoices" :
                 activeTab === "reports" ? "System Reports" :
                 activeTab === "settings" ? "Ledger Settings" : "System Logs"}
              </h1>
              <span className="hidden sm:inline px-2 py-0.5 bg-white/10 text-card-soft font-extrabold rounded-full text-[9px] uppercase">
                PAVAN ERP
              </span>
            </div>
          </div>

          {/* Middle Section: Global Search */}
          <div className="flex-1 max-w-xs mx-4 hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 text-card-soft/80 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Global ledger lookup..."
                className="w-full pl-9 pr-3 py-1.5 border border-white/10 bg-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-card-soft font-bold text-card-soft text-[11px] placeholder:text-card-soft/60"
              />
            </div>
          </div>

          {/* Right Section: popups of notes and alerts */}
          <div className="flex items-center gap-2.5">
            
            {/* Notes Indicator */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotesPopupOpen(!isNotesPopupOpen);
                  setIsNotifPopupOpen(false);
                }}
                className={`p-2 rounded-xl transition-all relative duration-200 ${isNotesPopupOpen ? "bg-card-soft text-primary shadow-sm" : "bg-white/10 hover:bg-white/20 text-card-soft"}`}
                title="Administrative Memo Notes"
              >
                <StickyNote className="w-4 h-4" />
                {notes.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-primary font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {notes.length}
                  </span>
                )}
              </button>

              {/* Compact Notes Popover */}
              {isNotesPopupOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsNotesPopupOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 dialog-glass p-4 rounded-2xl shadow-xl z-40 animate-fade-in text-charcoal space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-border-sand/40">
                      <h4 className="font-extrabold text-xs text-charcoal uppercase">Administrative Memos</h4>
                      <span className="text-[8px] uppercase font-bold text-stone/60">{notes.length} pinned</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar pr-0.5">
                      <NotesWidget 
                        notes={notes}
                        onAddNote={handleAddNote}
                        onUpdateNote={handleUpdateNote}
                        onDeleteNote={handleDeleteNote}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notification Alerts Indicator */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifPopupOpen(!isNotifPopupOpen);
                  setIsNotesPopupOpen(false);
                }}
                className={`p-2 rounded-xl transition-all relative duration-200 ${isNotifPopupOpen ? "bg-card-soft text-primary shadow-sm" : "bg-white/10 hover:bg-white/20 text-card-soft"}`}
                title="System Notifications"
              >
                <Bell className="w-4 h-4" />
                {logs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {Math.min(9, logs.length)}
                  </span>
                )}
              </button>

              {/* Compact Notifications Popover */}
              {isNotifPopupOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsNotifPopupOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 dialog-glass p-4 rounded-2xl shadow-xl z-40 animate-fade-in text-charcoal space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-border-sand/40">
                      <h4 className="font-extrabold text-xs text-charcoal uppercase">Audit Activity Trail</h4>
                      <button 
                        onClick={() => { setActiveTab("logs"); setIsNotifPopupOpen(false); }}
                        className="text-[9px] font-extrabold text-primary-dark hover:underline uppercase"
                      >
                        View Logs
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2.5 no-scrollbar">
                      {logs.length === 0 ? (
                        <p className="text-stone text-center py-4">No audit trails recorded.</p>
                      ) : (
                        logs.slice(0, 5).map(log => (
                          <div key={log.id} className="p-2 bg-primary/5 border border-border-sand/20 rounded-xl text-[10px] flex gap-2 items-start">
                            <span className="text-xs shrink-0 mt-0.5">🔔</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-charcoal text-[10px] leading-tight">{log.action}: {log.details}</p>
                              <p className="text-[8px] text-stone font-mono mt-0.5">{log.timestamp}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Session Account Info */}
            <div className="hidden lg:flex flex-col text-right pl-2 border-l border-border-sand/50">
              <span className="font-extrabold text-primary uppercase tracking-widest text-[8px]">Owner GSTIN</span>
              <span className="font-mono text-stone text-[9px] font-bold">{settings.gstIn}</span>
            </div>
          </div>
        </header>

        {/* Main Content scroll window */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 no-scrollbar w-full max-w-[1400px] mx-auto">
          
          {/* DASHBOARD MODULE */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Top stat indices bento grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 no-print">
                {/* Card 1: Today's Sales */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-caps text-label-caps text-stone uppercase tracking-wider">Today's Sales</span>
                    <div className="p-1.5 bg-primary/15 text-primary-dark rounded-full shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display-sm text-display-sm text-primary-dark font-extrabold tracking-tight font-mono">
                      {settings.currency}{todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </h2>
                    <span className="text-[10px] text-primary-dark flex items-center font-bold mt-1">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" /> Active dispatches today
                    </span>
                  </div>
                </div>

                {/* Card 2: Monthly Sales */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-caps text-label-caps text-stone uppercase tracking-wider">Monthly Sales</span>
                    <div className="p-1.5 bg-primary/15 text-primary-dark rounded-full shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display-sm text-display-sm text-charcoal font-extrabold tracking-tight font-mono">
                      {settings.currency}{monthlySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </h2>
                    <span className="text-[10px] text-primary-dark flex items-center font-bold mt-1">
                      Current month total sales
                    </span>
                  </div>
                </div>

                {/* Card 3: Outstanding Receivables */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-caps text-label-caps text-stone uppercase tracking-wider">Receivables</span>
                    <div className="p-1.5 bg-rose-500/10 text-rose-600 rounded-full shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display-sm text-display-sm text-rose-600 font-extrabold tracking-tight font-mono">
                      {settings.currency}{totalOutstandingReceivables.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </h2>
                    <div className="w-full bg-border-sand/40 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-rose-500 h-full w-[70%]" />
                    </div>
                  </div>
                </div>

                {/* Card 4: Outstanding Payables */}
                <div className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-caps text-label-caps text-stone uppercase tracking-wider">Payables</span>
                    <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-full shrink-0">
                      <Factory className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display-sm text-display-sm text-amber-600 font-extrabold tracking-tight font-mono">
                      {settings.currency}{totalOutstandingPayables.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </h2>
                    <div className="w-full bg-border-sand/40 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-amber-500 h-full w-[35%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Static SVG Analytics row */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 no-print">
                {/* Graph Card */}
                <div className="glass-card rounded-2xl p-5 md:col-span-8 flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-border-sand/30">
                    <div>
                      <h4 className="font-bold text-charcoal text-xs font-display uppercase tracking-wider">Turnover Sales Performance Matrix</h4>
                      <p className="text-[9px] text-stone mt-0.5">Chronological invoice values generated over the current period</p>
                    </div>
                    <span className="text-primary-dark font-bold text-[10px] uppercase">Real-Time Ledger</span>
                  </div>

                  {/* Responsive Clean SVG Bar Chart */}
                  <div className="flex-1 flex items-end justify-between h-44 border-b border-border-sand/40 pb-2 font-mono text-[9px] text-stone">
                    {invoices.length === 0 ? (
                      <div className="w-full text-center py-10 text-stone font-medium font-sans">
                        No transactions logged to populate performance analytics.
                      </div>
                    ) : (
                      invoices.slice(-7).map((inv, idx) => {
                        const percentHeight = Math.min(100, Math.max(10, (inv.total / (grossSalesTotal || 1)) * 140));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                            <span className="hidden group-hover:block bg-charcoal text-card-soft font-bold p-1 rounded font-mono text-[8px] absolute -translate-y-8">
                              {settings.currency}{inv.total.toLocaleString()}
                            </span>
                            <div 
                              style={{ height: `${percentHeight}px` }} 
                              className="w-8 bg-primary hover:bg-primary-dark rounded-t transition-all shadow-sm duration-200"
                            />
                            <span className="truncate max-w-[45px] text-[8px]">{inv.invoiceNumber}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quick actions wizard */}
                <div className="glass-card rounded-2xl p-5 md:col-span-4 space-y-3">
                  <h4 className="font-bold text-charcoal text-xs font-display uppercase tracking-wider border-b border-border-sand/30 pb-2">
                    Commercial Quick Actions
                  </h4>

                  <button 
                    onClick={triggerQuickInvoice}
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-card-soft font-bold rounded shadow-md flex items-center justify-center gap-2 text-[10px] uppercase font-display transition-transform active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" /> Dispatch material Invoice
                  </button>

                  <button 
                    onClick={triggerQuickQuote}
                    className="w-full py-2.5 bg-charcoal hover:bg-charcoal/90 text-card-soft font-bold rounded shadow-md flex items-center justify-center gap-2 text-[10px] uppercase font-display transition-transform active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4" /> Draft Client Deal Quote
                  </button>

                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-2 text-[10px] text-primary-dark font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Always ensure material stocks are updated.</span>
                  </div>
                </div>
              </div>

              {/* Notes Widget & Recent activities */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Notes Widget (takes 7 columns) */}
                <div className="md:col-span-7 glass-card rounded-2xl p-5">
                  <div className="flex justify-between items-center pb-2 border-b border-border-sand/30 mb-3">
                    <h4 className="font-bold text-charcoal text-xs font-display uppercase tracking-wider font-semibold">Administrative Memo Notepad</h4>
                    <span className="px-2 py-0.5 bg-primary/15 text-primary-dark font-bold rounded-full text-[9px] uppercase">
                      Pinned memos
                    </span>
                  </div>
                  <NotesWidget 
                    notes={notes}
                    onAddNote={handleAddNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                  />
                </div>

                {/* Recent Activities (takes 5 columns) */}
                <div className="md:col-span-5 glass-card rounded-2xl p-5 flex flex-col h-full">
                  <div className="flex justify-between items-center pb-2 border-b border-border-sand/30 mb-3">
                    <h4 className="font-bold text-charcoal text-xs font-display uppercase tracking-wider font-semibold">Historical Audit Logs</h4>
                    <button 
                      onClick={() => setActiveTab("logs")}
                      className="text-primary-dark hover:underline font-bold text-[10px]"
                    >
                      View All
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px]">
                    {logs.length === 0 ? (
                      <p className="text-stone py-6 text-center">No activities recorded in the ledger yet.</p>
                    ) : (
                      logs.slice(0, 5).map(log => (
                        <div key={log.id} className="p-2.5 bg-card-soft/30 border border-border-sand/40 rounded-xl text-[10px] flex gap-2.5 items-start">
                          <span className="text-xs shrink-0">🔔</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-charcoal">{log.action}: {log.details}</p>
                            <p className="text-[8px] text-stone font-mono mt-0.5">{log.timestamp} • {log.module}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* BUYERS MODULE */}
          {activeTab === "buyers" && (
            <BuyersManager 
              buyers={buyers}
              ledgerEntries={buyerLedgerEntries}
              onAddBuyer={handleAddBuyer}
              onUpdateBuyer={handleUpdateBuyer}
              onDeleteBuyer={handleDeleteBuyer}
              currency={settings.currency}
            />
          )}

          {/* SUPPLIERS MODULE */}
          {activeTab === "suppliers" && (
            <SuppliersManager 
              suppliers={suppliers}
              ledgerEntries={supplierLedgerEntries}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              currency={settings.currency}
            />
          )}

          {/* INVENTORY CATALOGUE MODULE */}
          {activeTab === "inventory" && (
            <InventoryManager 
              materials={materials}
              adjustments={stockAdjustments}
              onAddMaterial={handleAddMaterial}
              onUpdateMaterial={handleUpdateMaterial}
              onDeleteMaterial={handleDeleteMaterial}
              onAdjustStock={handleAdjustStock}
              currency={settings.currency}
            />
          )}

          {/* QUOTATIONS MODULE */}
          {activeTab === "quotations" && (
            <QuotationsManager 
              quotations={quotations}
              buyers={buyers}
              materials={materials}
              onAddQuotation={handleAddQuotation}
              onUpdateQuotation={handleUpdateQuotation}
              onConvertQuotation={handleConvertQuotation}
              onDeleteQuotation={handleDeleteQuotation}
              currency={settings.currency}
              defaultGstRate={settings.defaultGstRate}
            />
          )}

          {/* INVOICES MODULE */}
          {activeTab === "invoices" && (
            <InvoicesManager 
              invoices={invoices}
              buyers={buyers}
              materials={materials}
              suppliers={suppliers}
              onAddInvoice={handleAddInvoice}
              onAddPayment={handleAddPayment}
              onAddAttachment={handleAddAttachment}
              onDuplicateInvoice={handleDuplicateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              currency={settings.currency}
              defaultGstRate={settings.defaultGstRate}
              qrCodeUrl={settings.qrCodeUrl || ""}
              appUrl="http://localhost:3000"
            />
          )}

          {/* REPORTS MODULE */}
          {activeTab === "reports" && (
            <ReportsManager 
              invoices={invoices}
              buyers={buyers}
              suppliers={suppliers}
              materials={materials}
              currency={settings.currency}
            />
          )}

          {/* SETTINGS MODULE */}
          {activeTab === "settings" && (
            <SettingsManager 
              businessName={settings.companyName}
              businessAddress={settings.address}
              businessPhone={settings.phone}
              businessGstin={settings.gstIn}
              gstRate={settings.defaultGstRate}
              currency={settings.currency}
              qrCodeUrl={settings.qrCodeUrl || ""}
              onSaveSettings={handleSaveSettings}
              onWipeDatabase={handleWipeDatabase}
            />
          )}

          {/* AUDIT TRAIL LOGS MODULE */}
          {activeTab === "logs" && (
            <div className="glass-card rounded-xl overflow-hidden shadow-sm flex flex-col h-full font-sans">
              <div className="p-4 border-b border-border-sand/30 bg-primary/10">
                <h3 className="font-bold text-charcoal text-xs uppercase tracking-wider font-display">Administrative System Audit Trail Logbook</h3>
                <p className="text-[10px] text-stone mt-0.5">Chronological audit ledger tracing all changes inside invoices, quotes, stock catalog, and buyer accounts.</p>
              </div>

              <div className="p-4 overflow-y-auto max-h-[500px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary text-card-soft font-bold uppercase tracking-wider text-[9px] border-b border-border-sand/40">
                      <th className="px-4 py-2.5">Timestamp</th>
                      <th className="px-4 py-2.5">Operator</th>
                      <th className="px-4 py-2.5">Action</th>
                      <th className="px-4 py-2.5">Module Target</th>
                      <th className="px-4 py-2.5">Modification Logs / Coordinates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-sand/20 font-medium text-charcoal text-[11px]">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-primary/5 transition-colors duration-150">
                        <td className="px-4 py-2.5 font-mono text-stone">{log.timestamp}</td>
                        <td className="px-4 py-2.5 font-bold text-charcoal">Admin</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            log.action === "Create" || log.action === "Payment" ? "bg-emerald-500/15 text-emerald-800" :
                            log.action === "Update" ? "bg-amber-500/15 text-amber-800" : "bg-rose-500/15 text-rose-800"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-stone uppercase text-[9px]">{log.module}</td>
                        <td className="px-4 py-2.5 text-charcoal">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Toast Notification HUD */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-lg font-bold flex items-center gap-2.5 transition-all ${
          toast.type === "error" 
            ? "bg-rose-50 border-rose-200 text-rose-800 animate-fade-in" 
            : "bg-emerald-50 border-emerald-200 text-emerald-800 animate-fade-in"
        }`}>
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span className="text-[11px] font-sans font-semibold leading-normal">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
