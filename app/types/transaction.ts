export interface Transaction {
  id: string;
  date: string;
  successDate?: string;
  amount: number;
  withdrawId: string;
  utr?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  status: TransactionStatus;
  source?: string; // Added to track which account/collection the transaction comes from
}

export type TransactionStatus = "Succeeded" | "Failed" | "Processing";

export interface ApiResponse<T> {
  code: number;
  data: {
    records: T[];
    total: number;
    pages: number;
    page: number;
    size: number;
  };
}

export interface ProducerApiPayload {
  code: string;
  ts: number;
  cts: string;
  pkg: string;
  channel: string;
  pn: string;
  ip: string;
  platform: string;
  aid: string;
  gaid?: string | null;
  taurus_stat_uuid?: string | null;
  uid: string;
  type: string;
  listJson: Array<{
    ts: string;
    eventKey: string;
    eventValue: string;
  }>;
}

export interface WithdrawApiPayload {
  page: number;
  size: number;
}

export interface RawTransaction {
  created: string;
  modified?: string;
  amount: number;
  withdrawId: string;
  utr?: string | null;
  status: number;
  withdrawRequest?: string;
}
