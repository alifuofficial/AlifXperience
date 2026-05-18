import { useState, useEffect } from "react";
import { Users, UserCheck, Search, X, Loader2 } from "lucide-react";

interface Author {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface CoAuthorsPanelProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  primaryAuthorId?: string;
}

export default function CoAuthorsPanel({
  selectedIds,
  onChange,
  primaryAuthorId,
}: CoAuthorsPanelProps) {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/authors")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAuthors(data);
        }
      })
      .catch((err) => console.error("Failed to load authors:", err))
      .finally(() => setLoading(false));
  }, []);

  // Filter out the primary author (who is already the main author)
  const availableAuthors = authors.filter((a) => a.id !== primaryAuthorId);

  const filteredAuthors = availableAuthors.filter((a) => {
    const term = search.toLowerCase();
    const nameMatch = a.name?.toLowerCase().includes(term) ?? false;
    const emailMatch = a.email.toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  const toggleAuthor = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const getSelectedAuthors = () => {
    return authors.filter((a) => selectedIds.includes(a.id));
  };

  return (
    <div className="bg-white rounded-xl border border-brand-100/60 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-brand-300" />
        <h3 className="text-[10px] font-bold text-brand-900 uppercase tracking-wider">
          Co-Authors
        </h3>
      </div>

      <p className="text-[8px] font-medium text-brand-400 leading-normal mb-4">
        Assign multiple creators to share ownership, display their profiles, and credit contributors of this article.
      </p>

      {/* Selected Authors list */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 p-2.5 bg-brand-50/50 rounded-lg border border-brand-100/40">
          {getSelectedAuthors().map((a) => (
            <div
              key={a.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-brand-900 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm"
            >
              <span>{a.name || a.email}</span>
              <button
                type="button"
                onClick={() => toggleAuthor(a.id)}
                className="hover:text-accent-400 transition-colors p-0.5"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-300" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search authors by name..."
          className="w-full pl-8 pr-3 py-1.5 text-[9px] font-medium text-brand-850 placeholder-brand-200 bg-brand-50 rounded-lg border border-brand-100 focus:outline-none focus:ring-1 focus:ring-accent-400 focus:border-accent-400 transition-all"
        />
      </div>

      {/* List of Authors */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 text-brand-300 animate-spin" />
        </div>
      ) : filteredAuthors.length === 0 ? (
        <p className="text-[9px] font-medium text-brand-300 italic">No other authors found.</p>
      ) : (
        <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-brand-50">
          {filteredAuthors.map((author) => {
            const isSelected = selectedIds.includes(author.id);
            return (
              <button
                key={author.id}
                type="button"
                onClick={() => toggleAuthor(author.id)}
                className={`w-full flex items-center justify-between py-2 text-left transition-all ${
                  isSelected ? "text-accent-600 font-bold" : "text-brand-600 hover:text-brand-900"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold truncate">
                      {author.name || author.email}
                    </span>
                    <span
                      className={`text-[7px] px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                        author.role === "ADMIN"
                          ? "bg-accent-50 text-accent-700 border border-accent-100"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      }`}
                    >
                      {author.role}
                    </span>
                  </div>
                  <span className="text-[8px] text-brand-300 font-medium block truncate">
                    {author.email}
                  </span>
                </div>
                {isSelected ? (
                  <UserCheck className="w-3.5 h-3.5 text-accent-600 flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded border border-brand-200 hover:border-brand-400 transition-all flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
