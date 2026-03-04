import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { OrgRow } from "@/hooks/usePlatformDashboard";

interface Props {
  organizations: OrgRow[];
}

type SortKey = "name" | "members" | "contacts" | "campaigns" | "messages" | "deliveryRate" | "lastActivity";

export function PlatformOrgsTable({ organizations }: Props) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = organizations.filter(
      (o) => o.name.toLowerCase().includes(q) || (o.industry ?? "").toLowerCase().includes(q)
    );

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "lastActivity") {
        cmp = (a.lastActivity ?? "").localeCompare(b.lastActivity ?? "");
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortAsc ? cmp : -cmp;
    });

    return rows;
  }, [organizations, search, sortKey, sortAsc]);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </TableHead>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Organizations</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orgs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Name" field="name" />
                <TableHead>Industry</TableHead>
                <SortHeader label="Members" field="members" />
                <SortHeader label="Contacts" field="contacts" />
                <SortHeader label="Campaigns" field="campaigns" />
                <SortHeader label="Messages" field="messages" />
                <SortHeader label="Delivery Rate" field="deliveryRate" />
                <SortHeader label="Last Activity" field="lastActivity" />
                <TableHead>Onboarding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-muted-foreground">{org.industry ?? "—"}</TableCell>
                    <TableCell>{org.members}</TableCell>
                    <TableCell>{org.contacts}</TableCell>
                    <TableCell>{org.campaigns}</TableCell>
                    <TableCell>{org.messages}</TableCell>
                    <TableCell>
                      <span className={org.deliveryRate >= 80 ? "text-success font-medium" : org.deliveryRate >= 50 ? "text-warning font-medium" : "text-destructive font-medium"}>
                        {org.messages > 0 ? `${org.deliveryRate}%` : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.lastActivity
                        ? formatDistanceToNow(new Date(org.lastActivity), { addSuffix: true })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.onboarding_completed ? "default" : "secondary"}>
                        {org.onboarding_completed ? "Complete" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
