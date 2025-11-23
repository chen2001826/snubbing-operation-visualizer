import { WorkflowNode, ScenarioType } from './types';

// Helper to check approximate equality for simulation purposes
const isZero = (val: number) => val === 0;
const isEqual = (a: number, b: number) => Math.abs(a - b) < 0.1;

export const SCENARIOS = [
  { id: ScenarioType.CONDITION_1, name: '条件1: 直接推过环形', description: '初始状态: 环形关闭，上下闸板打开' },
  { id: ScenarioType.CONDITION_2, name: '条件2: 双闸板倒扣', description: '初始状态: 利用上下闸板交替密封过接箍' },
  { id: ScenarioType.CONDITION_3, name: '条件3: 环形和闸板交替', description: '初始状态: 环形和上下工作闸板同时利用' },
];

export const CONDITION_1_TREE: WorkflowNode = {
  id: 'c1-root',
  label: '开始: 直接推过环形',
  type: 'start',
  detail: '初始状态: 环形关闭, 上下闸板打开',
  isActive: () => true,
  children: [
    {
      id: 'c1-step1',
      label: '确定环形关闭压力',
      type: 'action',
      detail: '由套压 P3=P2=P1 确定',
      isActive: () => true,
      children: [
        {
          id: 'c1-check-p0',
          label: '检测 P0',
          type: 'decision',
          detail: '此时若 P0 ≠ 0',
          isActive: () => true,
          children: [
            {
              id: 'c1-adjust',
              label: '调节环形关闭压力',
              type: 'action',
              detail: '发现 P0 不为 0，需增加封井压力',
              isActive: (p) => !isZero(p.p0),
            },
            {
              id: 'c1-ok',
              label: '压力正常',
              type: 'action',
              detail: 'P0 为 0, 继续作业',
              isActive: (p) => isZero(p.p0),
            },
          ],
        },
      ],
    },
  ],
};

export const CONDITION_2_TREE: WorkflowNode = {
  id: 'c2-root',
  label: '条件2: 双闸板倒扣',
  type: 'start',
  detail: '环形失效或高压时使用',
  isActive: () => true,
  children: [
    {
      id: 'c2-no-joint',
      label: '不过接箍',
      type: 'decision',
      isActive: (p, op) => !op.isPassingJoint,
      children: [
        {
          id: 'c2-normal-seal',
          label: '单闸板密封',
          type: 'action',
          detail: '默认关闭下闸板密封',
          isActive: () => true,
          children: [
            {
              id: 'c2-check-seal',
              label: '密封检查',
              type: 'check',
              detail: '需 P2=0 且 P0=0',
              isActive: (p) => isZero(p.p2) && isZero(p.p0),
            },
            {
              id: 'c2-seal-fail',
              label: '密封异常',
              type: 'action',
              detail: '若P2升高，检查下闸板',
              isActive: (p) => !isZero(p.p2) || !isZero(p.p0),
            }
          ]
        }
      ]
    },
    {
      id: 'c2-joint',
      label: '过接箍作业',
      type: 'decision',
      isActive: (p, op) => op.isPassingJoint,
      children: [
        {
          id: 'c2-swap-prep',
          label: '1. 倒换前准备',
          type: 'action',
          detail: '关上闸板',
          isActive: () => true,
          children: [
            {
              id: 'c2-check-balance',
              label: '2. 压力平衡检测',
              type: 'decision',
              detail: '检测 P2 是否等于 P3',
              isActive: () => true,
              children: [
                {
                  id: 'c2-balance-ok',
                  label: '压力平衡 (P2=P3)',
                  type: 'action',
                  detail: '开下闸板 -> 过接箍',
                  isActive: (p) => isEqual(p.p2, p.p3),
                  children: [
                    {
                      id: 'c2-pass-done',
                      label: '过完接箍',
                      type: 'action',
                      detail: '关下闸板 -> 泄压P2 -> 开上闸板',
                      isActive: () => true
                    }
                  ]
                },
                {
                  id: 'c2-balance-needed',
                  label: '需平衡 (P2≠P3)',
                  type: 'action',
                  detail: '打开平衡阀引入套压',
                  isActive: (p) => !isEqual(p.p2, p.p3)
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const CONDITION_3_TREE: WorkflowNode = {
  id: 'c3-root',
  label: '条件3: 环形/闸板协同',
  type: 'start',
  detail: '利用过接箍',
  isActive: () => true,
  children: [
    {
      id: 'c3-no-joint',
      label: '不过接箍阶段',
      type: 'decision',
      isActive: (p, op) => !op.isPassingJoint,
      children: [
        {
          id: 'c3-nj-action',
          label: '确定下工作闸板压力',
          type: 'action',
          detail: '由 P3 确定',
          isActive: () => true,
          children: [
            {
              id: 'c3-nj-rih',
              label: '下油管作业',
              type: 'check',
              detail: '理想: P0=P1=P2=0',
              isActive: (p, op) => op.direction === 'RIH',
              children: [
                 {
                    id: 'c3-nj-rih-check',
                    label: '检测 P2',
                    type: 'decision',
                    detail: '若 P2 ≠ 0',
                    isActive: (p, op) => !isZero(p.p2),
                    children: [{ id: 'c3-nj-rih-fix', label: '调节下闸板', type: 'action', isActive: () => true }]
                 }
              ]
            },
            {
              id: 'c3-nj-pooh',
              label: '起油管作业',
              type: 'check',
              detail: '理想: P0=P1=0 & P2=P3',
              isActive: (p, op) => op.direction === 'POOH',
              children: [
                 {
                    id: 'c3-nj-pooh-check',
                    label: '检测 P1',
                    type: 'decision',
                    detail: '若 P1 ≠ 0',
                    isActive: (p, op) => !isZero(p.p1),
                    children: [{ id: 'c3-nj-pooh-fix', label: '调节上闸板', type: 'action', isActive: () => true }]
                 }
              ]
            }
          ]
        }
      ],
    },
    {
      id: 'c3-joint',
      label: '过接箍阶段',
      type: 'decision',
      isActive: (p, op) => op.isPassingJoint,
      children: [
        // RIH (下油管) - Passing Joint
        {
          id: 'c3-rih-main',
          label: '下油管: 过接箍',
          type: 'decision',
          isActive: (p, op) => op.direction === 'RIH',
          children: [
            {
              id: 'c3-rih-open-upper',
              label: '1. 上闸板打开前',
              type: 'check',
              detail: '判断 P1=P2=0',
              isActive: () => true,
              children: [
                {
                   id: 'c3-rih-upper-ok',
                   label: '条件满足',
                   type: 'action',
                   detail: '打开上闸板过接箍',
                   isActive: (p) => isZero(p.p1) && isZero(p.p2)
                },
                {
                   id: 'c3-rih-upper-fail',
                   label: '条件不满足',
                   type: 'action',
                   detail: '打开泄压四通 -> P2=P1=0',
                   isActive: (p) => !isZero(p.p1) || !isZero(p.p2)
                }
              ]
            },
            {
              id: 'c3-rih-open-lower',
              label: '2. 下闸板打开前',
              type: 'check',
              detail: '判断 P2=P3 & P0=P1=0',
              isActive: () => true,
              children: [
                {
                  id: 'c3-rih-lower-ok',
                  label: '条件满足',
                  type: 'action',
                  detail: '打开下闸板过接箍',
                  isActive: (p) => isEqual(p.p2, p.p3) && isZero(p.p0) && isZero(p.p1)
                },
                {
                  id: 'c3-rih-lower-fail',
                  label: '条件不满足',
                  type: 'action',
                  detail: '平衡四通打开: 倒压力 -> P2=P3',
                  isActive: (p) => !isEqual(p.p2, p.p3) || !isZero(p.p0) || !isZero(p.p1),
                  children: [
                     {
                        id: 'c3-rih-check-fail-sub',
                        label: '异常处理',
                        type: 'decision',
                        detail: '若P2≠P3查四通; 若P1≠0调上闸板; 若P0≠0调环形',
                        isActive: () => true
                     }
                  ]
                }
              ]
            }
          ]
        },
        // POOH (起油管) - Passing Joint
        {
          id: 'c3-pooh-main',
          label: '起油管: 过接箍',
          type: 'decision',
          isActive: (p, op) => op.direction === 'POOH',
          children: [
            {
              id: 'c3-pooh-open-lower',
              label: '1. 下闸板打开前',
              type: 'check',
              detail: '判断 P2=P3 & P0=P1=0',
              isActive: () => true,
              children: [
                {
                  id: 'c3-pooh-lower-ok',
                  label: '条件满足',
                  type: 'action',
                  detail: '打开下闸板过接箍',
                  isActive: (p) => isEqual(p.p2, p.p3) && isZero(p.p0) && isZero(p.p1)
                },
                {
                  id: 'c3-pooh-lower-fail',
                  label: '条件不满足',
                  type: 'action',
                  detail: '平衡四通打开 -> 倒压',
                  isActive: (p) => !isEqual(p.p2, p.p3) || !isZero(p.p0) || !isZero(p.p1)
                }
              ]
            },
            {
               id: 'c3-pooh-open-upper',
               label: '2. 上闸板打开前',
               type: 'check',
               detail: '判断 P1=P2=0',
               isActive: () => true,
               children: [
                  {
                    id: 'c3-pooh-upper-ok',
                    label: '条件满足',
                    type: 'action',
                    detail: '打开上闸板',
                    isActive: (p) => isZero(p.p1) && isZero(p.p2)
                  },
                  {
                    id: 'c3-pooh-upper-fail',
                    label: '条件不满足',
                    type: 'action',
                    detail: '打开泄压四通 -> P2=P1=0',
                    isActive: (p) => !isZero(p.p1) || !isZero(p.p2)
                  }
               ]
            }
          ]
        }
      ],
    },
  ],
};