"use client"

import { useState, useEffect } from "react"
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Progress, Chip, Divider } from "@heroui/react"
import { Key, Cpu, TrendingUp, Settings, CheckCircle, AlertCircle } from "lucide-react"
import Axios from "@/lib/Axios"
import { toast } from "react-hot-toast"

const AISettings = () => {
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState(null)
  const [formData, setFormData] = useState({
    aiProvider: "gemini",
    apiKey: "",
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await Axios.get("/api/v1/ai-settings")
      setConfig(response.data)
      setFormData({
        aiProvider: response.data.aiProvider || "gemini",
        apiKey: "",
      })
    } catch (error) {
      toast.error("Failed to load AI settings")
    } finally {
      setLoading(false)
    }
  }

  const handleTestKey = async () => {
    if (!formData.apiKey) {
      toast.error("Please enter an API key")
      return
    }

    try {
      setTesting(true)
      const response = await Axios.post("/api/v1/ai-settings/test-key", formData)
      
      if (response.data.success) {
        toast.success("API key is valid! ✅")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "API key validation failed")
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!formData.apiKey) {
      toast.error("Please enter an API key")
      return
    }

    try {
      const response = await Axios.put("/api/v1/ai-settings/provider", formData)
      toast.success("AI settings saved successfully!")
      setFormData({ ...formData, apiKey: "" })
      fetchConfig()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings")
    }
  }

  const handleRemoveKey = async () => {
    if (!confirm("Are you sure you want to remove your API key?")) return

    try {
      await Axios.delete("/api/v1/ai-settings/provider")
      toast.success("API key removed")
      fetchConfig()
    } catch (error) {
      toast.error("Failed to remove API key")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading AI settings...</p>
        </div>
      </div>
    )
  }

  const usagePercentage = config?.usagePercentage || 0
  const hasKey = config?.hasApiKey

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Explanation Settings</h1>
        <p className="text-gray-600">
          Use your own AI API key to generate explanations for MCQs that don't have them
        </p>
      </div>

      {/* Usage Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Current Month Usage</span>
              </div>
              <p className="text-2xl font-bold">
                {config?.tokenUsage?.currentMonth?.toLocaleString() || 0} / {config?.tokenQuota?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500">tokens</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={20} className="text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Total Used</span>
              </div>
              <p className="text-2xl font-bold">{config?.tokenUsage?.totalUsed?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-500">tokens (all time)</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Settings size={20} className="text-green-600" />
                <span className="text-sm font-medium text-gray-600">Status</span>
              </div>
              <Chip color={hasKey ? "success" : "warning"} variant="flat" className="mt-2">
                {hasKey ? "Active" : "Not Configured"}
              </Chip>
            </div>
          </div>
          <Divider className="my-4" />
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Quota Usage</span>
              <span className="text-sm font-bold">{usagePercentage}%</span>
            </div>
            <Progress
              value={usagePercentage}
              color={usagePercentage > 80 ? "danger" : usagePercentage > 50 ? "warning" : "success"}
              className="h-2"
            />
          </div>
        </CardBody>
      </Card>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key size={20} />
            <h2 className="text-xl font-semibold">API Key Configuration</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {hasKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={20} />
                <span className="font-medium">API Key Configured</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Your {config.aiProvider === "openai" ? "OpenAI" : config.aiProvider === "anthropic" ? "Anthropic" : "Google Gemini"} API key is active and ready to use
              </p>
            </div>
          )}

          <Select
            label="AI Provider"
            placeholder="Select provider"
            selectedKeys={[formData.aiProvider]}
            onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value })}
            classNames={{
              trigger: "h-12",
            }}
          >
            <SelectItem key="gemini">
              Google Gemini 1.5 Flash
            </SelectItem>
            <SelectItem key="openai">
              OpenAI (GPT-4o Mini)
            </SelectItem>
            <SelectItem key="anthropic">
              Anthropic (Claude 3.5 Haiku)
            </SelectItem>
          </Select>

          <Input
            type="password"
            label="API Key"
            placeholder={
              formData.aiProvider === "openai"
                ? "sk-..."
                : formData.aiProvider === "anthropic"
                ? "sk-ant-..."
                : "AIza..."
            }
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            classNames={{
              input: "font-mono",
              inputWrapper: "h-12",
            }}
            description={
              formData.aiProvider === "openai"
                ? "Get your API key from platform.openai.com"
                : formData.aiProvider === "anthropic"
                ? "Get your API key from console.anthropic.com"
                : "Get your API key from makersuite.google.com/app/apikey"
            }
          />

          <div className="flex gap-3">
            <Button color="primary" onClick={handleSave} className="flex-1">
              Save API Key
            </Button>
            <Button variant="bordered" onClick={handleTestKey} isLoading={testing} className="flex-1">
              Test Key
            </Button>
            {hasKey && (
              <Button color="danger" variant="flat" onClick={handleRemoveKey}>
                Remove
              </Button>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={20} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Your API key is encrypted and stored securely</li>
                  <li>Explanations are generated only when missing from database</li>
                  <li>You have {config?.tokenQuota?.toLocaleString()} tokens per month</li>
                  <li>Average explanation uses 200-300 tokens</li>
                  <li>Generated explanations are cached to save tokens</li>
                </ul>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Provider Comparison */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Provider Comparison</h3>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Provider</th>
                  <th className="text-left py-3 px-2">Model</th>
                  <th className="text-left py-3 px-2">Cost per 1M tokens</th>
                  <th className="text-left py-3 px-2">Speed</th>
                  <th className="text-left py-3 px-2">Quality</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium">Google Gemini</td>
                  <td className="py-3 px-2">Gemini 1.5 Flash</td>
                  <td className="py-3 px-2">$0.075</td>
                  <td className="py-3 px-2">
                    <Chip size="sm" color="success">Very Fast</Chip>
                  </td>
                  <td className="py-3 px-2">
                    <Chip size="sm" color="success">Excellent</Chip>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium">OpenAI</td>
                  <td className="py-3 px-2">GPT-4o Mini</td>
                  <td className="py-3 px-2">$0.15</td>
                  <td className="py-3 px-2">
                    <Chip size="sm" color="success">Fast</Chip>
                  </td>
                  <td className="py-3 px-2">
                    <Chip size="sm" color="success">Excellent</Chip>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium">Anthropic</td>
                  <td className="py-3 px-2">Claude 3.5 Haiku</td>
                  <td className="py-3 px-2">$1.00</td>
                  <td className="py-3 px-2">
                    <Chip size="sm" color="warning">Medium</Chip>
                  </td>
                  <td className="py-3 px-2">
                    <Chip size="sm" color="success">Excellent</Chip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default AISettings
