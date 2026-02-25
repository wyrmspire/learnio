import { useState, useEffect } from "react";
import { dataClient } from "../data";
import { Capability, CapabilityUnit, ProgressEvent, Recommendation, Attempt } from "../contracts/schemas";

// Simple SWR-like hooks for the sandbox
export function useCapabilities() {
  const [data, setData] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataClient.listCapabilities().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}

export function useCapability(id: string) {
  const [data, setData] = useState<Capability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    dataClient.getCapability(id).then(res => {
      setData(res);
      setLoading(false);
    });
  }, [id]);

  return { data, loading };
}

export function useProgressFeed() {
  const [data, setData] = useState<ProgressEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const mutate = () => {
    dataClient.listProgressEvents().then(res => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    mutate();
  }, []);

  return { data, loading, mutate };
}

export function useSubmitAttempt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = async (attempt: Attempt) => {
    setLoading(true);
    setError(null);
    try {
      await dataClient.submitAttempt(attempt);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to submit attempt"));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error };
}
