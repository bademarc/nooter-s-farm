"use client"

import { useState, useContext } from "react"
import Link from "next/link"
import { 
  FileText, 
  ArrowLeft, 
  BarChart, 
  ClipboardList, 
  CircleDollarSign, 
  Plus,
  PenLine,
  Eye,
  Trash2,
  Star,
  Clock,
  Package
} from "lucide-react"
import { GameContext } from "@/context/game-context"

// Define item and contract types
interface ContractItem {
  id: string
  name: string
  description: string
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary"
  value: number
  icon: string
  locked?: boolean
}

interface Contract {
  id: string
  title: string
  description: string
  items: ContractItem[]
  createdAt: Date
  updatedAt: Date
  status: "draft" | "active" | "completed" | "cancelled"
  value: number
}

// Mock inventory items
const inventoryItems: ContractItem[] = [
  { id: "i1", name: "Magic Beans", description: "Grows into giant plants overnight", rarity: "Epic", value: 400, icon: "🌱" },
  { id: "i2", name: "Golden Corn", description: "Premium golden corn", rarity: "Rare", value: 250, icon: "🌽" },
  { id: "i3", name: "Rainbow Flower", description: "Multicolored flowers", rarity: "Uncommon", value: 150, icon: "🌷" },
  { id: "i4", name: "Wheat Bundle", description: "Standard wheat bundle", rarity: "Common", value: 50, icon: "🌾" },
  { id: "i5", name: "Ancient Tree Sapling", description: "A mystical ancient tree", rarity: "Legendary", value: 800, icon: "🌳" },
  { id: "i6", name: "Golden Hen", description: "Lays golden eggs daily", rarity: "Epic", value: 500, icon: "🐔" },
  { id: "i7", name: "Super Cow", description: "Produces premium milk", rarity: "Rare", value: 300, icon: "🐄" },
  { id: "i8", name: "Spotted Pig", description: "Happy little pig", rarity: "Common", value: 100, icon: "🐖" },
  { id: "i9", name: "Diamond Hoe", description: "Super durable hoe for farming", rarity: "Epic", value: 450, icon: "⛏️" },
  { id: "i10", name: "Enchanted Watering Can", description: "Waters plants automatically", rarity: "Rare", value: 325, icon: "🚿" },
  { id: "i11", name: "Steel Shovel", description: "Standard shovel for digging", rarity: "Common", value: 80, icon: "🧹" },
  { id: "i12", name: "Mythical Unicorn", description: "A legendary farm companion", rarity: "Legendary", value: 1000, icon: "🦄" }
]

// Mock contracts
const mockContracts: Contract[] = [
  {
    id: "c1",
    title: "Exotic Seeds Collection",
    description: "A collection of rare and exotic seeds",
    items: [
      inventoryItems[0],
      inventoryItems[1],
      inventoryItems[2]
    ],
    createdAt: new Date("2023-05-10"),
    updatedAt: new Date("2023-05-12"),
    status: "active",
    value: 800
  },
  {
    id: "c2",
    title: "Premium Livestock",
    description: "High quality farm animals",
    items: [
      inventoryItems[5],
      inventoryItems[6],
      { ...inventoryItems[7], locked: true }
    ],
    createdAt: new Date("2023-04-15"),
    updatedAt: new Date("2023-04-20"),
    status: "completed",
    value: 900
  }
]

// Component to display a contract item
const ItemCard = ({ item, onRemove, isPreview, isLocked = false }: { 
  item: ContractItem, 
  onRemove?: () => void,
  isPreview?: boolean,
  isLocked?: boolean
}) => {
  const rarityColor = 
    item.rarity === "Common" ? "border-gray-400" : 
    item.rarity === "Uncommon" ? "border-green-500" :
    item.rarity === "Rare" ? "border-blue-500" :
    item.rarity === "Epic" ? "border-purple-500" :
    "border-yellow-500"
    
  const rarityTextColor = 
    item.rarity === "Common" ? "text-gray-400" : 
    item.rarity === "Uncommon" ? "text-green-400" :
    item.rarity === "Rare" ? "text-blue-400" :
    item.rarity === "Epic" ? "text-purple-400" :
    "text-yellow-400"
  
  return (
    <div className={`border ${rarityColor} p-3 ${isLocked ? 'opacity-50' : ''} relative`}>
      <div className="flex items-start">
        <div className="text-3xl mr-3">{item.icon}</div>
        <div className="flex-1">
          <h3 className="text-white font-medium">{item.name}</h3>
          <p className="text-white/60 text-xs">{item.description}</p>
          <div className="flex items-center justify-between mt-1">
            <div className={`flex items-center ${rarityTextColor} text-xs`}>
              <Star className="h-3 w-3 mr-1" />
              {item.rarity}
            </div>
            <div className="flex items-center text-xs">
              <CircleDollarSign className="h-3 w-3 mr-1 text-yellow-500" />
              {item.value}
            </div>
          </div>
        </div>
        {!isPreview && onRemove && !isLocked && (
          <button 
            onClick={onRemove} 
            className="text-white/60 hover:text-white p-1"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Locked
          </div>
        </div>
      )}
    </div>
  )
}

// Contract simulator page component
export default function ContractSimulatorPage() {
  const { playerLevel, playerXp, farmCoins } = useContext(GameContext)
  const [contracts, setContracts] = useState<Contract[]>(mockContracts)
  const [inventory, setInventory] = useState<ContractItem[]>(inventoryItems)
  const [activeTab, setActiveTab] = useState<"contracts" | "create" | "inventory">("contracts")
  const [selectedItems, setSelectedItems] = useState<ContractItem[]>([])
  const [contractTitle, setContractTitle] = useState("")
  const [contractDescription, setContractDescription] = useState("")
  const [viewingContract, setViewingContract] = useState<Contract | null>(null)
  
  // Function to create a new contract
  const createContract = () => {
    if (!contractTitle.trim()) {
      alert("Please enter a contract title")
      return
    }
    
    if (selectedItems.length === 0) {
      alert("Please select at least one item for the contract")
      return
    }
    
    const newContract: Contract = {
      id: `c${contracts.length + 1}`,
      title: contractTitle,
      description: contractDescription || "No description provided",
      items: selectedItems,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "draft",
      value: selectedItems.reduce((sum, item) => sum + item.value, 0)
    }
    
    setContracts([...contracts, newContract])
    
    // Reset form
    setContractTitle("")
    setContractDescription("")
    setSelectedItems([])
    setActiveTab("contracts")
  }
  
  // Function to activate a contract
  const activateContract = (contractId: string) => {
    setContracts(prev => prev.map(contract => 
      contract.id === contractId 
        ? { ...contract, status: "active", updatedAt: new Date() } 
        : contract
    ))
  }
  
  // Function to complete a contract
  const completeContract = (contractId: string) => {
    setContracts(prev => prev.map(contract => 
      contract.id === contractId 
        ? { ...contract, status: "completed", updatedAt: new Date() } 
        : contract
    ))
  }
  
  // Function to cancel a contract
  const cancelContract = (contractId: string) => {
    setContracts(prev => prev.map(contract => 
      contract.id === contractId 
        ? { ...contract, status: "cancelled", updatedAt: new Date() } 
        : contract
    ))
  }
  
  // Function to delete a contract
  const deleteContract = (contractId: string) => {
    setContracts(prev => prev.filter(contract => contract.id !== contractId))
  }
  
  // Function to toggle an item in the selection
  const toggleItemSelection = (item: ContractItem) => {
    if (selectedItems.some(i => i.id === item.id)) {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id))
    } else {
      setSelectedItems(prev => [...prev, item])
    }
  }
  
  // Function to remove an item from selection
  const removeSelectedItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId))
  }

  return (
    <div className="container mx-auto py-8 px-4 noot-theme min-h-screen bg-black">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/farm-cases" className="mr-2">
            <button className="noot-button border-2 border-yellow-500 bg-black hover:bg-yellow-500 hover:text-black font-bold py-2 px-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <Link href="/">
            <button className="noot-button border-2 border-yellow-500 bg-black hover:bg-yellow-500 hover:text-black font-bold py-2 px-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Main Page
            </button>
          </Link>
          <h1 className="text-3xl text-gradient-gold noot-title ml-4">Contract Simulator</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-black border-2 border-yellow-500 px-3 py-1">
            <CircleDollarSign className="h-4 w-4 mr-2 text-yellow-500" />
            <span className="text-sm font-bold">{farmCoins} Coins</span>
          </div>
          <div className="flex items-center bg-black border-2 border-yellow-500 px-3 py-1">
            <BarChart className="h-4 w-4 mr-2 text-yellow-500" />
            <span className="text-sm font-bold">Level {playerLevel} | {playerXp} XP</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex border-b-2 border-yellow-500">
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "contracts" 
              ? "border-yellow-500 text-yellow-500" 
              : "border-transparent text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("contracts")}
        >
          Your Contracts
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "create" 
              ? "border-yellow-500 text-yellow-500" 
              : "border-transparent text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("create")}
        >
          Create Contract
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === "inventory" 
              ? "border-yellow-500 text-yellow-500" 
              : "border-transparent text-white/60 hover:text-white"
          }`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
      </div>

      {viewingContract ? (
        <div>
          <button 
            className="noot-button mb-4"
            onClick={() => setViewingContract(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Contracts
          </button>
          
          <div className="noot-card">
            <div className="border-b border-[var(--noot-border)] p-4">
              <h2 className="noot-header text-white noot-title text-xl">
                {viewingContract.title}
              </h2>
              <p className="text-white/60 text-sm mt-1">
                {viewingContract.description}
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`px-2 py-1 text-xs rounded ${
                    viewingContract.status === "draft" ? "bg-white/10 text-white" :
                    viewingContract.status === "active" ? "bg-highlight-blue text-white" :
                    viewingContract.status === "completed" ? "bg-green-500 text-white" :
                    "bg-red-500 text-white"
                  }`}>
                    {viewingContract.status.charAt(0).toUpperCase() + viewingContract.status.slice(1)}
                  </div>
                  <div className="ml-2 text-xs text-white/60 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(viewingContract.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center">
                  {viewingContract.status === "draft" && (
                    <button 
                      className="noot-button bg-highlight-blue"
                      onClick={() => {
                        activateContract(viewingContract.id)
                        setViewingContract({...viewingContract, status: "active"})
                      }}
                    >
                      Activate
                    </button>
                  )}
                  {viewingContract.status === "active" && (
                    <button 
                      className="noot-button bg-success"
                      onClick={() => {
                        completeContract(viewingContract.id)
                        setViewingContract({...viewingContract, status: "completed"})
                      }}
                    >
                      Complete
                    </button>
                  )}
                  {(viewingContract.status === "draft" || viewingContract.status === "active") && (
                    <button 
                      className="noot-button bg-destructive ml-2"
                      onClick={() => {
                        cancelContract(viewingContract.id)
                        setViewingContract({...viewingContract, status: "cancelled"})
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-white/60 mb-2">Contract Items:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {viewingContract.items.map(item => (
                    <ItemCard key={item.id} item={item} isPreview isLocked={item.locked} />
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 border border-[var(--noot-border)] bg-[var(--noot-bg)]">
                <div className="text-sm">Total Contract Value:</div>
                <div className="flex items-center text-lg font-medium">
                  <CircleDollarSign className="h-4 w-4 mr-1 text-yellow-500" />
                  {viewingContract.value}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  )
  
  // Render the content based on active tab
  function renderTabContent() {
    switch (activeTab) {
      case "contracts":
        return (
          <div>
            <h2 className="noot-title text-xl">Your Contracts</h2>
            <div className="flex justify-end mb-4">
              <button 
                className="noot-button bg-white text-black"
                onClick={() => setActiveTab("create")}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Contract
              </button>
            </div>
            
            {contracts.length === 0 ? (
              <div className="noot-card p-8 text-center">
                <div className="text-4xl mb-4">📑</div>
                <p className="text-muted-foreground">You don't have any contracts yet</p>
                <button 
                  className="noot-button bg-white text-black mt-4"
                  onClick={() => setActiveTab("create")}
                >
                  Create Your First Contract
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contracts.map(contract => (
                  <div key={contract.id} className="noot-card">
                    <div className="p-4 border-b border-[var(--noot-border)]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{contract.title}</h3>
                          <div className="text-sm text-white/60 mt-1 line-clamp-1">
                            {contract.description}
                          </div>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded ${
                          contract.status === "draft" ? "bg-white/10 text-white" :
                          contract.status === "active" ? "bg-highlight-blue text-white" :
                          contract.status === "completed" ? "bg-green-500 text-white" :
                          "bg-red-500 text-white"
                        }`}>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <CircleDollarSign className="h-4 w-4 mr-1 text-yellow-500" />
                          <span>{contract.value}</span>
                        </div>
                        <div className="text-xs text-white/60 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(contract.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm mb-4">
                        <Package className="h-4 w-4 mr-1" />
                        <span>{contract.items.length} items</span>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="p-2 text-white/60 hover:text-white"
                          onClick={() => deleteContract(contract.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-2 text-white/60 hover:text-white"
                          onClick={() => setViewingContract(contract)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      
      case "create":
        return (
          <div>
            <h2 className="noot-title text-xl mb-4">Create New Contract</h2>
            <div className="noot-card p-6">
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">Contract Title</label>
                <input
                  type="text"
                  className="noot-input w-full"
                  placeholder="Enter a title for your contract"
                  value={contractTitle}
                  onChange={(e) => setContractTitle(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">Description</label>
                <textarea
                  className="noot-input w-full h-24"
                  placeholder="Enter a description for your contract"
                  value={contractDescription}
                  onChange={(e) => setContractDescription(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">Selected Items</label>
                {selectedItems.length === 0 ? (
                  <div className="text-center p-4 text-white/60 border border-[var(--noot-border)] bg-[var(--noot-bg)]">
                    No items selected. Select items from your inventory below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[var(--noot-border)] bg-[var(--noot-bg)] p-4">
                    {selectedItems.map(item => (
                      <ItemCard 
                        key={item.id} 
                        item={item} 
                        onRemove={() => removeSelectedItem(item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-white/60 mb-1">Select Items from Inventory</label>
                <div className="max-h-60 overflow-y-auto border border-[var(--noot-border)] bg-[var(--noot-bg)] p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inventory.map(item => (
                      <div 
                        key={item.id}
                        className={`border p-2 cursor-pointer ${
                          selectedItems.some(i => i.id === item.id)
                            ? "border-highlight-gold"
                            : "border-[var(--noot-border)]"
                        }`}
                        onClick={() => toggleItemSelection(item)}
                      >
                        <div className="flex items-center">
                          <div className="text-2xl mr-2">{item.icon}</div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-white/60">{item.description}</div>
                            <div className="flex items-center mt-1">
                              <div className="text-xs text-white/60 flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {item.rarity}
                              </div>
                              <div className="text-xs text-white/60 flex items-center ml-2">
                                <CircleDollarSign className="h-3 w-3 mr-1 text-yellow-500" />
                                {item.value}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button 
                  className="noot-button"
                  onClick={() => setActiveTab("contracts")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Cancel
                </button>
                <button 
                  className="noot-button bg-white text-black"
                  onClick={createContract}
                  disabled={!contractTitle || selectedItems.length === 0}
                >
                  Create Contract
                </button>
              </div>
            </div>
          </div>
        )
      
      case "inventory":
        return (
          <div>
            <h2 className="noot-title text-xl mb-4">Your Inventory</h2>
            <div className="noot-card p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {inventory.map(item => (
                  <ItemCard key={item.id} item={item} isPreview />
                ))}
              </div>
              
              <div className="mt-6">
                <button className="noot-button">
                  Get More Items
                </button>
              </div>
            </div>
          </div>
        )
    }
  }
} 