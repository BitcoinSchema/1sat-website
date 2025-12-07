"use client";

import { useState } from "react";
import { Page, PageContent, PageHeader, PageTitle } from "@/components/page-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, File as FileIcon, Image as ImageIcon, Music, Video, Code } from "lucide-react";

export default function InscribePage() {
  const [activeTab, setActiveTab] = useState("file");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [isMinting, setIsMinting] = useState(false);

  // BSV20 State
  const [bsv20Mode, setBsv20Mode] = useState<"mint" | "deploy">("mint");
  const [bsv20Ticker, setBsv20Ticker] = useState("");
  const [bsv20Amount, setBsv20Amount] = useState("");
  const [bsv20Max, setBsv20Max] = useState("");
  const [bsv20Decimals, setBsv20Decimals] = useState("0");
  const [bsv20Limit, setBsv20Limit] = useState("");

  // BSV21 State
  const [bsv21Mode, setBsv21Mode] = useState<"mint" | "deploy">("mint");
  const [bsv21Id, setBsv21Id] = useState("");
  const [bsv21Amount, setBsv21Amount] = useState("");
  // Deploy fields for BSV21 could be complex (parent, symbol, etc.) - keeping simple for now
  const [bsv21Symbol, setBsv21Symbol] = useState("");
  const [bsv21Decimals, setBsv21Decimals] = useState("0");
  const [bsv21Max, setBsv21Max] = useState("");


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const f = e.target.files[0];
        setFile(f);
        setFileType(f.type);
        
        if (f.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(f));
        } else {
            setPreviewUrl(null);
        }
    }
  };

  const handleInscribe = async () => {
      setIsMinting(true);
      try {
          // TODO: Implement actual minting logic using js-1sat-ord or WalletService
          // const tx = await walletService.createInscription(...)
          await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
          alert("Inscription created! (Mock)");
      } catch (e) {
          console.error(e);
          alert("Error creating inscription");
      } finally {
          setIsMinting(false);
      }
  };

  const renderFilePreview = () => {
      if (!file) return null;

      if (fileType.startsWith("image/")) {
          return (
              <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-lg border bg-muted">
                  <img src={previewUrl!} alt="Preview" className="h-full w-full object-contain" />
              </div>
          );
      }
      
      return (
          <div className="flex aspect-square w-full max-w-[300px] flex-col items-center justify-center rounded-lg border bg-muted p-4 text-center">
             {fileType.startsWith("video/") && <Video className="h-12 w-12 text-muted-foreground mb-2" />}
             {fileType.startsWith("audio/") && <Music className="h-12 w-12 text-muted-foreground mb-2" />}
             {fileType.startsWith("text/") && <Code className="h-12 w-12 text-muted-foreground mb-2" />}
             {!fileType.startsWith("video/") && !fileType.startsWith("audio/") && !fileType.startsWith("text/") && <FileIcon className="h-12 w-12 text-muted-foreground mb-2" />}
             <p className="text-sm font-medium">{file.name}</p>
             <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
      );
  };

  return (
    <Page>
        <PageHeader>
            <PageTitle>Inscribe</PageTitle>
        </PageHeader>
        <PageContent>
            <div className="grid gap-6 lg:grid-cols-2">
                <Tabs defaultValue="file" value={activeTab} onValueChange={setActiveTab} className="w-full lg:col-span-1">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="file">File</TabsTrigger>
                        <TabsTrigger value="bsv20">BSV20</TabsTrigger>
                        <TabsTrigger value="bsv21">BSV21</TabsTrigger>
                    </TabsList>

                    {/* File Tab */}
                    <TabsContent value="file">
                        <Card>
                            <CardHeader>
                                <CardTitle>Inscribe File</CardTitle>
                                <CardDescription>Upload an image, HTML, or other file.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="file">File</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="file" type="file" onChange={handleFileChange} className="cursor-pointer" />
                                    </div>
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                     <Label htmlFor="meta">Metadata (Optional JSON)</Label>
                                     <Textarea id="meta" placeholder="{ 'name': 'My Inscription' }" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleInscribe} disabled={!file || isMinting}>
                                    {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Inscribe
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* BSV20 Tab */}
                    <TabsContent value="bsv20">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>BSV20</CardTitle>
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <Button 
                                            variant={bsv20Mode === "mint" ? "secondary" : "ghost"} 
                                            size="sm" 
                                            onClick={() => setBsv20Mode("mint")}
                                            className="h-7 text-xs"
                                        >
                                            Mint
                                        </Button>
                                        <Button 
                                            variant={bsv20Mode === "deploy" ? "secondary" : "ghost"} 
                                            size="sm" 
                                            onClick={() => setBsv20Mode("deploy")}
                                            className="h-7 text-xs"
                                        >
                                            Deploy
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription>
                                    {bsv20Mode === "mint" ? "Mint existing BSV20 tokens." : "Deploy a new BSV20 token ticker."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="bsv20-ticker">Ticker</Label>
                                    <Input 
                                        id="bsv20-ticker" 
                                        placeholder="e.g. PEPE" 
                                        value={bsv20Ticker} 
                                        onChange={(e) => setBsv20Ticker(e.target.value.toUpperCase())} 
                                        maxLength={4}
                                    />
                                </div>
                                
                                {bsv20Mode === "mint" ? (
                                    <div className="grid gap-2">
                                        <Label htmlFor="bsv20-amount">Amount</Label>
                                        <Input 
                                            id="bsv20-amount" 
                                            type="number" 
                                            placeholder="1000" 
                                            value={bsv20Amount} 
                                            onChange={(e) => setBsv20Amount(e.target.value)} 
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bsv20-max">Max Supply</Label>
                                            <Input 
                                                id="bsv20-max" 
                                                type="number" 
                                                placeholder="21000000" 
                                                value={bsv20Max} 
                                                onChange={(e) => setBsv20Max(e.target.value)} 
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bsv20-limit">Mint Limit</Label>
                                            <Input 
                                                id="bsv20-limit" 
                                                type="number" 
                                                placeholder="1000" 
                                                value={bsv20Limit} 
                                                onChange={(e) => setBsv20Limit(e.target.value)} 
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bsv20-dec">Decimals</Label>
                                            <Input 
                                                id="bsv20-dec" 
                                                type="number" 
                                                placeholder="0" 
                                                value={bsv20Decimals} 
                                                onChange={(e) => setBsv20Decimals(e.target.value)} 
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleInscribe} disabled={!bsv20Ticker || isMinting}>
                                    {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {bsv20Mode === "mint" ? "Mint Tokens" : "Deploy Ticker"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* BSV21 Tab */}
                    <TabsContent value="bsv21">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>BSV21</CardTitle>
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <Button 
                                            variant={bsv21Mode === "mint" ? "secondary" : "ghost"} 
                                            size="sm" 
                                            onClick={() => setBsv21Mode("mint")}
                                            className="h-7 text-xs"
                                        >
                                            Mint
                                        </Button>
                                        <Button 
                                            variant={bsv21Mode === "deploy" ? "secondary" : "ghost"} 
                                            size="sm" 
                                            onClick={() => setBsv21Mode("deploy")}
                                            className="h-7 text-xs"
                                        >
                                            Deploy
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription>
                                    {bsv21Mode === "mint" ? "Mint BSV21 tokens using ID." : "Deploy a new BSV21 token contract."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {bsv21Mode === "mint" ? (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bsv21-id">Token ID (TxId)</Label>
                                            <Input 
                                                id="bsv21-id" 
                                                placeholder="TxId of deployment" 
                                                value={bsv21Id} 
                                                onChange={(e) => setBsv21Id(e.target.value)} 
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bsv21-amount">Amount</Label>
                                            <Input 
                                                id="bsv21-amount" 
                                                type="number" 
                                                placeholder="1000" 
                                                value={bsv21Amount} 
                                                onChange={(e) => setBsv21Amount(e.target.value)} 
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bsv21-sym">Symbol</Label>
                                            <Input 
                                                id="bsv21-sym" 
                                                placeholder="TEST" 
                                                value={bsv21Symbol} 
                                                onChange={(e) => setBsv21Symbol(e.target.value.toUpperCase())} 
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bsv21-max">Max Supply</Label>
                                            <Input 
                                                id="bsv21-max" 
                                                type="number" 
                                                placeholder="21000000" 
                                                value={bsv21Max} 
                                                onChange={(e) => setBsv21Max(e.target.value)} 
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bsv21-dec">Decimals</Label>
                                            <Input 
                                                id="bsv21-dec" 
                                                type="number" 
                                                placeholder="0" 
                                                value={bsv21Decimals} 
                                                onChange={(e) => setBsv21Decimals(e.target.value)} 
                                            />
                                        </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={handleInscribe} disabled={isMinting}>
                                    {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {bsv21Mode === "mint" ? "Mint Tokens" : "Deploy Contract"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Preview Section - Always visible on large screens */}
                <div className="space-y-6">
                    <Card className="h-full border-dashed">
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                            <CardDescription>
                                See how your inscription will look.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                            {activeTab === "file" && file ? (
                                renderFilePreview()
                            ) : activeTab === "bsv20" && bsv20Ticker ? (
                                <div className="text-center space-y-2">
                                    <div className="text-4xl font-bold">{bsv20Ticker}</div>
                                    <div className="text-sm text-muted-foreground">BSV20 {bsv20Mode === "mint" ? "Mint" : "Deploy"}</div>
                                    {bsv20Mode === "mint" && <div className="text-xl">{bsv20Amount}</div>}
                                </div>
                            ) : activeTab === "bsv21" && (bsv21Id || bsv21Symbol) ? (
                                <div className="text-center space-y-2">
                                    <div className="text-4xl font-bold">{bsv21Symbol || "BSV21"}</div>
                                    <div className="text-sm text-muted-foreground">BSV21 {bsv21Mode === "mint" ? "Mint" : "Deploy"}</div>
                                    {bsv21Mode === "mint" && <div className="text-xs font-mono text-muted-foreground break-all">{bsv21Id}</div>}
                                </div>
                            ) : (
                                <div className="text-muted-foreground text-center">
                                    <div className="mb-2 flex justify-center">
                                        <ImageIcon className="h-10 w-10 opacity-20" />
                                    </div>
                                    Configure an inscription to see preview
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContent>
    </Page>
  );
}