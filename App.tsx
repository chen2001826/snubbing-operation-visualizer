import React, { useState, useMemo } from 'react';
import { SCENARIOS, CONDITION_1_TREE, CONDITION_2_TREE, CONDITION_3_TREE } from './constants';
import { ScenarioType, PressureState, OperationState } from './types';
import { DecisionTree } from './components/DecisionTree';
import { WellheadSchematic } from './components/WellheadSchematic';

const App: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(ScenarioType.CONDITION_1);
  
  // Simulation State
  const [pressures, setPressures] = useState<PressureState>({
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 5, // Default casing pressure
  });

  const [operation, setOperation] = useState<OperationState>({
    isPassingJoint: false,
    direction: 'RIH',
  });

  const currentTree = useMemo(() => {
    switch (activeScenario) {
      case ScenarioType.CONDITION_1: return CONDITION_1_TREE;
      case ScenarioType.CONDITION_2: return CONDITION_2_TREE;
      case ScenarioType.CONDITION_3: return CONDITION_3_TREE;
      default: return CONDITION_1_TREE;
    }
  }, [activeScenario]);

  // Derived Schematic State (Rough approximation based on text logic for visuals)
  const activeValves = useMemo(() => {
    if (activeScenario === ScenarioType.CONDITION_1) {
        return { annular: true, upperRam: false, lowerRam: false };
    }

    const p = pressures;
    const op = operation;
    
    // Condition 2: Double Ram Stripping
    if (activeScenario === ScenarioType.CONDITION_2) {
        // Simple logic for Double Ram:
        // Annular typically NOT used as primary seal in this mode (Open or Closed based on setup, assume Open/Inactive for clarity)
        // Rams alternate.
        
        let upperRam = false;
        let lowerRam = false;

        if (!op.isPassingJoint) {
            // Normal seal: Lower Ram Closed (Standard safety)
            lowerRam = false; 
            upperRam = true; // Upper Open
        } else {
            // Passing Joint
            // Depends on Pressure P2
            // If P2 is High (balanced with P3), Lower Ram can open, Upper must be closed
            if (p.p2 > p.p3 * 0.9) {
                lowerRam = true; // Open
                upperRam = false; // Closed
            } else {
                // If P2 is Low (bled off), Upper Ram can open, Lower must be closed
                lowerRam = false; // Closed
                upperRam = true; // Open
            }
        }
        return { annular: false, upperRam, lowerRam };
    }

    // Condition 3: Hybrid
    let annular = false;
    let upperRam = true;
    let lowerRam = true;

    if (!op.isPassingJoint) {
         // Not passing joint, usually rams act as seal
         upperRam = true;
         lowerRam = true;
    } else {
        // Passing joint logic
        if (op.direction === 'RIH') {
             // If P1=P2=0, Open Upper. 
             upperRam = !(p.p1 === 0 && p.p2 === 0);
             // If conditions met, Open Lower
             lowerRam = !(p.p2 === p.p3 && p.p0 === 0);
        } else {
             // POOH
             lowerRam = !(p.p2 === p.p3 && p.p0 === 0);
             upperRam = !(p.p1 === 0 && p.p2 === 0);
        }
    }

    return { annular, upperRam, lowerRam };
  }, [activeScenario, pressures, operation]);

  const handlePressureChange = (key: keyof PressureState, value: string) => {
    const num = parseFloat(value);
    setPressures(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <header className="max-w-[1600px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">带压作业动密封可视流程</h1>
            <p className="text-slate-500 mt-2">基于现场操作规程的交互式可视化指南</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
            {SCENARIOS.map(s => (
                <button
                    key={s.id}
                    onClick={() => setActiveScenario(s.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeScenario === s.id 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                    }`}
                >
                    {s.name}
                </button>
            ))}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Schematic */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Control Panel */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    参数模拟 (Simulation)
                </h2>
                
                {/* Condition 2 & 3 Specific Controls */}
                {activeScenario !== ScenarioType.CONDITION_1 && (
                    <div className="mb-6 space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        {activeScenario === ScenarioType.CONDITION_3 && (
                        <div>
                            <span className="block text-xs font-semibold text-slate-500 uppercase mb-2">作业方向</span>
                            <div className="flex bg-slate-200 p-1 rounded-lg">
                                <button 
                                    onClick={() => setOperation(p => ({ ...p, direction: 'RIH' }))}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${operation.direction === 'RIH' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                                >
                                    下油管 (RIH)
                                </button>
                                <button 
                                    onClick={() => setOperation(p => ({ ...p, direction: 'POOH' }))}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${operation.direction === 'POOH' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500'}`}
                                >
                                    起油管 (POOH)
                                </button>
                            </div>
                        </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">是否过接箍?</span>
                            <button 
                                onClick={() => setOperation(p => ({ ...p, isPassingJoint: !p.isPassingJoint }))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${operation.isPassingJoint ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${operation.isPassingJoint ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Pressure Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    {(['p0', 'p1', 'p2', 'p3'] as const).map(key => (
                        <div key={key} className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">{key.toUpperCase()} (MPa)</label>
                            <input 
                                type="number" 
                                value={pressures[key]} 
                                onChange={(e) => handlePressureChange(key, e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex gap-2">
                    <button 
                        onClick={() => setPressures({ p0: 0, p1: 0, p2: 0, p3: 5 })}
                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded transition-colors"
                    >
                        重置正常 (Reset)
                    </button>
                    <button 
                         onClick={() => setPressures({ p0: 2, p1: 2, p2: 5, p3: 5 })}
                         className="flex-1 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-medium rounded transition-colors"
                    >
                        模拟异常 (Simulate Error)
                    </button>
                </div>
            </section>

            {/* Schematic */}
            <WellheadSchematic pressures={pressures} activeValves={activeValves} />
        </div>

        {/* Right Column: Decision Tree */}
        <div className="lg:col-span-8 flex flex-col h-[600px] lg:h-auto min-h-[600px]">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                 <h2 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                    流程逻辑图 (Process Logic)
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                    蓝色路径表示当前条件下的激活流程。调节左侧压力参数可实时改变路径。
                </p>
                <div className="flex-1 relative overflow-hidden">
                     <DecisionTree data={currentTree} pressures={pressures} operation={operation} />
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;