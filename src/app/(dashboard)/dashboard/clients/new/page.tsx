import ClientForm from "@/components/ClientForm";
import { addClient } from "../actions";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Client</h1>
      <ClientForm action={addClient} submitLabel="Create Client" />
    </div>
  );
}
