"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Lightbulb, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitFeedbackRequest } from "@/lib/hooks/feedback/api";

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<"bug" | "feature_request">("feature_request");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }
    if (description.trim().length < 5) {
      setError("Description must be at least 5 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await submitFeedbackRequest({
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
      });

      if (!response.success) {
        setError(response.error || "Failed to submit feedback");
        return;
      }

      setSuccess(true);
      setTitle("");
      setDescription("");
      setFeedbackType("feature_request");

      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Send className="w-8 h-8 text-primary" />
            Send us your feedback
          </h1>
          <p className="text-slate-600">
            Help us improve Postsiva by sharing your ideas, reporting bugs, or requesting new features.
          </p>
        </div>

        {/* Feedback Form Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
          {/* Success Message */}
          {success && (
            <div className="mb-6 rounded-2xl bg-green-50 p-4 flex items-start gap-3 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800">Thank you!</h3>
                <p className="text-sm text-green-700">
                  Your feedback has been submitted successfully. We appreciate your input!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 flex items-start gap-3 border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Feedback Type */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-3">
                Feedback Type
              </label>
              <div className="space-y-3">
                {/* Feature Request Option */}
                <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" style={{borderColor: feedbackType === "feature_request" ? "rgb(59, 130, 246)" : undefined, backgroundColor: feedbackType === "feature_request" ? "rgb(239, 246, 255)" : undefined}}>
                  <input
                    type="radio"
                    name="feedbackType"
                    value="feature_request"
                    checked={feedbackType === "feature_request"}
                    onChange={(e) => setFeedbackType(e.target.value as "feature_request")}
                    disabled={loading}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-3 flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Feature Request</p>
                      <p className="text-sm text-slate-600">Suggest a new feature or improvement</p>
                    </div>
                  </div>
                </label>

                {/* Bug Report Option */}
                <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors" style={{borderColor: feedbackType === "bug" ? "rgb(239, 68, 68)" : undefined, backgroundColor: feedbackType === "bug" ? "rgb(254, 242, 242)" : undefined}}>
                  <input
                    type="radio"
                    name="feedbackType"
                    value="bug"
                    checked={feedbackType === "bug"}
                    onChange={(e) => setFeedbackType(e.target.value as "bug")}
                    disabled={loading}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">Bug Report</p>
                      <p className="text-sm text-slate-600">Report an issue or problem</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">
                Title
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={
                    feedbackType === "bug"
                      ? "e.g., Unable to schedule posts"
                      : "e.g., Dark mode support"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                  className="rounded-xl border-slate-200"
                  maxLength={200}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  {title.length}/200
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5">
                Description
              </label>
              <textarea
                placeholder={
                  feedbackType === "bug"
                    ? "Describe the issue in detail. What did you try to do? What happened instead?"
                    : "Tell us more about your feature idea. How would it help you?"
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-sans text-base"
                rows={6}
              />
              <p className="text-xs text-slate-500 mt-1">
                Minimum 5 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl gap-2 flex-1"
              >
                <Send className="w-4 h-4" />
                {loading ? "Sending..." : "Send Feedback"}
              </Button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Please be as specific as possible. Include steps to reproduce bugs and expected outcomes for feature requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
