export type Capability = {
  id: string;
  name: string;
  description: string;
  confidence: number; // 0-1
  stability: 'high' | 'medium' | 'low';
  lastEvidenceAt: string;
  weakestTag: string;
  nextAction: string;
  dueReviewsCount: number;
};

export type CapabilityUnit = {
  id: string;
  capabilityId: string;
  title: string;
  status: 'locked' | 'unlocked' | 'completed';
};

export const mockCapabilities: Capability[] = [
  {
    id: 'cap-1',
    name: 'System Architecture Design',
    description: 'Design robust and scalable system architectures.',
    confidence: 0.75,
    stability: 'high',
    lastEvidenceAt: '2026-02-24T10:00:00Z',
    weakestTag: 'Microservices Boundaries',
    nextAction: 'Run CU-3: Diagnose bottlenecks',
    dueReviewsCount: 2,
  },
  {
    id: 'cap-2',
    name: 'Incident Response',
    description: 'Effectively manage and resolve production incidents.',
    confidence: 0.42,
    stability: 'low',
    lastEvidenceAt: '2026-02-20T14:30:00Z',
    weakestTag: 'Root Cause Analysis',
    nextAction: 'Transfer test ready',
    dueReviewsCount: 0,
  },
  {
    id: 'cap-3',
    name: 'Performance Optimization',
    description: 'Identify and resolve performance bottlenecks in code and infrastructure.',
    confidence: 0.88,
    stability: 'high',
    lastEvidenceAt: '2026-02-25T08:15:00Z',
    weakestTag: 'Database Indexing',
    nextAction: 'Spaced retrieval due',
    dueReviewsCount: 5,
  },
  {
    id: 'cap-4',
    name: 'Security Auditing',
    description: 'Audit systems for security vulnerabilities and compliance.',
    confidence: 0.15,
    stability: 'medium',
    lastEvidenceAt: '2026-01-10T09:00:00Z',
    weakestTag: 'OAuth Flows',
    nextAction: 'Run CU-1: Threat Modeling',
    dueReviewsCount: 1,
  }
];

export const mockProgressEvents = [
  {
    id: 'evt-1',
    title: 'CU-3 stabilized from 0.42 → 0.58',
    timestamp: '2 hours ago',
    chips: ['Transfer pass', 'Hint-free', 'Error type: boundary conditions'],
    details: 'Successfully diagnosed the bottleneck in the payment processing queue without using any hints.'
  },
  {
    id: 'evt-2',
    title: 'Completed System Architecture Design Transfer Test',
    timestamp: '1 day ago',
    chips: ['Transfer pass', 'Zero-hint completion'],
    details: 'Passed the novel scenario test for designing a high-throughput event streaming architecture.'
  },
  {
    id: 'evt-3',
    title: 'Incident Response confidence dropped 0.50 → 0.42',
    timestamp: '5 days ago',
    chips: ['Spaced retrieval failed', 'Error type: root cause analysis'],
    details: 'Failed to identify the root cause in the simulated database outage scenario.'
  }
];
