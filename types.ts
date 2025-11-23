export enum ScenarioType {
  CONDITION_1 = 'CONDITION_1',
  CONDITION_2 = 'CONDITION_2',
  CONDITION_3 = 'CONDITION_3',
}

export interface PressureState {
  p0: number; // Tubing Pressure (Atmospheric side/Work area)
  p1: number; // Upper Chamber
  p2: number; // Lower Chamber (between rams)
  p3: number; // Casing Pressure (Wellbore)
}

export interface OperationState {
  isPassingJoint: boolean; // Passing collar?
  direction: 'RIH' | 'POOH'; // Running In Hole (下) / Pulling Out Of Hole (起)
}

export interface WorkflowNode {
  id: string;
  label: string;
  detail?: string;
  type: 'start' | 'decision' | 'action' | 'check';
  children?: WorkflowNode[];
  // Logic to determine if this node is active based on state
  isActive?: (pressures: PressureState, op: OperationState) => boolean;
}