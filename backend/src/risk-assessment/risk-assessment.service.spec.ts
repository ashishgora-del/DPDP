import { RiskAssessmentService } from './risk-assessment.service';

describe('RiskAssessmentService template mapping', () => {
  let service: RiskAssessmentService;

  beforeEach(() => {
    service = new RiskAssessmentService({ query: jest.fn() } as any);
    (service as any).mappingVersion = 'test-v1';
    (service as any).templateMatrixItems = [
      {
        rowNumber: 1,
        parentCategory: 'Policies',
        artifactId: 'BASE_POLICY',
        name: 'Base policy',
        description: 'Baseline policy',
        lowRiskMandatory: false,
        mediumRiskMandatory: true,
        highRiskMandatory: true,
        applicableRiskTiers: ['BASIC', 'MODERATE', 'HIGH'],
      },
      {
        rowNumber: 2,
        parentCategory: 'Governance',
        artifactId: 'HIGH_GOVERNANCE',
        name: 'High governance plan',
        description: 'High tier plan',
        lowRiskMandatory: false,
        mediumRiskMandatory: false,
        highRiskMandatory: true,
        applicableRiskTiers: ['HIGH'],
      },
      {
        rowNumber: 3,
        parentCategory: 'Exemptions',
        artifactId: 'RESEARCH_ARCHIVAL_STATISTICAL_EXEMPTION',
        name: 'Research exemption review',
        description: 'Verify specific use case',
        lowRiskMandatory: false,
        mediumRiskMandatory: false,
        highRiskMandatory: false,
        applicableRiskTiers: [],
      },
    ];
  });

  it('uses the selected tier flag to mark applicable templates', () => {
    const groups = (service as any).buildTemplateGroupsFromMatrix('BASIC', []);

    expect(groups).toHaveLength(1);
    expect(groups[0].children[0]).toMatchObject({
      artifactId: 'BASE_POLICY',
      mandatory: false,
      applicability: 'recommended',
      reasonCodes: ['TIER_BASIC_RECOMMENDED'],
    });
    expect(groups[0].mandatoryCount).toBe(0);
  });

  it.each([
    [35, 'BASIC'],
    [36, 'MODERATE'],
    [65, 'MODERATE'],
    [66, 'HIGH'],
  ])('resolves score %i to %s', (score, expectedTier) => {
    expect((service as any).resolveRiskTier(score)).toBe(expectedTier);
  });

  it('expands only tier-applicable templates and reports consistent counts', () => {
    const groups = (service as any).buildTemplateGroupsFromMatrix('HIGH', ['High governance']);
    const mapping = (service as any).buildMapping(groups);

    expect(mapping).toMatchObject({
      mappingVersion: 'test-v1',
      summaryCounts: {
        parentCount: 2,
        childCount: 2,
        mandatoryCount: 2,
        recommendedCount: 0,
      },
    });
    expect(mapping.selectedParents[1].children[0].reasonCodes).toEqual([
      'TIER_HIGH_MANDATORY',
      'FOCUS_AREA_MATCH',
    ]);
  });

  it('adds research exemption only as a review recommendation for research purposes', () => {
    const groups = (service as any).buildTemplateGroupsFromMatrix('BASIC', [], true);
    const mapping = (service as any).buildMapping(groups);
    const exemption = mapping.selectedParents.find(parent => parent.parentName === 'Exemptions');

    expect(exemption.selectionReason).toBe('Research purpose selected; verify exemption eligibility.');
    expect(exemption.children[0]).toMatchObject({
      applicability: 'recommended',
      reasonCodes: ['SCENARIO_RESEARCH_REVIEW'],
    });
    expect(mapping.summaryCounts.recommendedCount).toBe(1);
  });
});