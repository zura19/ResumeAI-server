export class TotalsResponseDto {
  users: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  subscriptions: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  monthlyRevenue: number;
  generatedResumes: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  totalAiCreditsUsed: number;
}
