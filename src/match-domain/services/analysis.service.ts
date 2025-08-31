import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { MatchLeaderboard } from '../analysis/match-leaderboard.analysis';
import { GlobalLeaderboard } from '../analysis/global-leaderboard.analysis';
import { MatchFragStreaks } from '../analysis/match-frag-streaks.analysis';
import { MatchSpeedKillers } from '../analysis/match-speed-killers.analysis';
import { MatchNoDeath } from '../analysis/match-no-death.analysis';
import { MatchWinner } from '../analysis/match-winner.analysis';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly matchLeaderboard: MatchLeaderboard,
    private readonly globalLeaderboard: GlobalLeaderboard,
    private readonly matchFragStreaks: MatchFragStreaks,
    private readonly matchSpeedKillers: MatchSpeedKillers,
    private readonly matchNoDeath: MatchNoDeath,
    private readonly matchWinner: MatchWinner,
  ) {}

  async getMatchLeaderboard(matchIdentifier: string) {
    const scores = await this.matchLeaderboard.execute(matchIdentifier);
    const [winner, ..._] = await this.matchWinner.execute(matchIdentifier);
    const speedKillers = await this.matchSpeedKillers.execute(matchIdentifier);
    const fragStreaks = await this.matchFragStreaks.execute(matchIdentifier);
    const noDeaths = await this.matchNoDeath.execute(matchIdentifier);

    return {
      winner,
      awards: {
        noDeaths,
        speedKillers,
      },
      scores,
      fragStreaks,
    }
  }

  async getGlobalLeaderboard() {
    return this.globalLeaderboard.execute();
  }
}
