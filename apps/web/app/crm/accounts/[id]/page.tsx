import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccountDetailPage({ params }: { params: { id: string } }) {
    // Placeholder data - in real app fetch by params.id
    const accountId = params.id;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/crm/accounts">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Account Detail: {accountId}</h1>
                    <p className="text-muted-foreground">Status: ACTIVE | Type: FARMER</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="contacts">Contacts</TabsTrigger>
                    <TabsTrigger value="interactions">Interactions</TabsTrigger>
                    <TabsTrigger value="commitments">Commitments</TabsTrigger>
                    <TabsTrigger value="risk">Risk & Legal</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Jurisdiction</p>
                                    <p>Russia, Krasnodar Region</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">INN</p>
                                    <p>2310031234</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Risk Category</p>
                                    <p className="text-green-600 font-bold">LOW</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Strategic Value</p>
                                    <p className="text-blue-600 font-bold">A</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="contacts">
                    <Card>
                        <CardContent className="pt-6">
                            <p>Contacts List Placeholder</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* Other tabs placeholders */}
                <TabsContent value="interactions">
                    <Card>
                        <CardContent className="pt-6">
                            <p>Interactions Journal Placeholder</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
