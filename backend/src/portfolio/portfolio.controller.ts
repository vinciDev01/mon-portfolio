import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all portfolio data aggregated in a single request',
  })
  getPortfolio() {
    return this.portfolioService.getPortfolio();
  }
}
