const canvas = document.getElementById('workspace');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const clearBtn = document.getElementById('clear-btn');
const moleculeList = document.getElementById('molecule-list');

// Setup Canvas Size
function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial size

// Atom Definitions (1~20번 원소)
const ATOM_DEF = {
    'H':  { name: '수소',    radius: 30, maxBonds: 1, color: '#ffffff', textColor: '#000000', mass: 1, ion: 'H<sup>+</sup>', isMetal: false },
    'He': { name: '헬륨',    radius: 28, maxBonds: 0, color: '#d1d8e0', textColor: '#000000', mass: 4, ion: 'He', isMetal: false },
    'Li': { name: '리튬',    radius: 55, maxBonds: 1, color: '#cc8e35', textColor: '#ffffff', mass: 7, ion: 'Li<sup>+</sup>', isMetal: true },
    'Be': { name: '베릴륨',  radius: 48, maxBonds: 2, color: '#c2cfd6', textColor: '#000000', mass: 9, ion: 'Be<sup>2+</sup>', isMetal: true },
    'B':  { name: '붕소',    radius: 45, maxBonds: 3, color: '#ffb8b8', textColor: '#000000', mass: 11, ion: 'B<sup>3+</sup>', isMetal: false },
    'C':  { name: '탄소',    radius: 50, maxBonds: 4, color: '#2f3542', textColor: '#ffffff', mass: 12, ion: 'C', isMetal: false },
    'N':  { name: '질소',    radius: 47, maxBonds: 3, color: '#1e90ff', textColor: '#ffffff', mass: 14, ion: 'N<sup>3-</sup>', isMetal: false },
    'O':  { name: '산소',    radius: 44, maxBonds: 2, color: '#ff4757', textColor: '#ffffff', mass: 16, ion: 'O<sup>2-</sup>', isMetal: false },
    'F':  { name: '플루오린', radius: 41, maxBonds: 1, color: '#9be010', textColor: '#000000', mass: 19, ion: 'F<sup>-</sup>', isMetal: false },
    'Ne': { name: '네온',    radius: 38, maxBonds: 0, color: '#b33939', textColor: '#ffffff', mass: 20, ion: 'Ne', isMetal: false },
    'Na': { name: '나트륨',  radius: 60, maxBonds: 1, color: '#ab87ed', textColor: '#ffffff', mass: 23, ion: 'Na<sup>+</sup>', isMetal: true },
    'Mg': { name: '마그네슘', radius: 55, maxBonds: 2, color: '#8ee53f', textColor: '#000000', mass: 24, ion: 'Mg<sup>2+</sup>', isMetal: true },
    'Al': { name: '알루미늄', radius: 50, maxBonds: 3, color: '#bfa6a6', textColor: '#000000', mass: 27, ion: 'Al<sup>3+</sup>', isMetal: true },
    'Si': { name: '규소',    radius: 58, maxBonds: 4, color: '#f0c330', textColor: '#000000', mass: 28, ion: 'Si', isMetal: false },
    'P':  { name: '인',      radius: 56, maxBonds: 3, color: '#ff9f43', textColor: '#000000', mass: 31, ion: 'P<sup>3-</sup>', isMetal: false },
    'S':  { name: '황',      radius: 54, maxBonds: 2, color: '#feca57', textColor: '#000000', mass: 32, ion: 'S<sup>2-</sup>', isMetal: false },
    'Cl': { name: '염소',    radius: 52, maxBonds: 1, color: '#1dd1a1', textColor: '#000000', mass: 35, ion: 'Cl<sup>-</sup>', isMetal: false },
    'Ar': { name: '아르곤',  radius: 50, maxBonds: 0, color: '#808e9b', textColor: '#ffffff', mass: 40, ion: 'Ar', isMetal: false },
    'K':  { name: '칼륨',    radius: 65, maxBonds: 1, color: '#8c7ae6', textColor: '#ffffff', mass: 39, ion: 'K<sup>+</sup>', isMetal: true },
    'Ca': { name: '칼슘',    radius: 60, maxBonds: 2, color: '#3dc1d3', textColor: '#000000', mass: 40, ion: 'Ca<sup>2+</sup>', isMetal: true }
};

let atoms = [];
let nextId = 1;
let isDragging = false;
let draggedAtom = null;
let lastMousePos = { x: 0, y: 0 };
let globalScale = 1.0;

const scaleSlider = document.getElementById('atom-scale-slider');
if (scaleSlider) {
    scaleSlider.addEventListener('input', (e) => {
        globalScale = parseFloat(e.target.value);
    });
}


function addAtomAt(type, x, y) {
    const def = ATOM_DEF[type];
    const atom = {
        id: nextId++,
        type: type,
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: def.radius,
        maxBonds: def.maxBonds,
        color: def.color,
        symbol: type,
        textColor: def.textColor,
        mass: def.mass,
        bonds: [], // Stores IDs of bonded atoms
        bondLines: [], // Stores physical springs
        recentlyBonded: 30 // Cooldown to prevent instant multi-bonds
    };
    atoms.push(atom);
    return atom;
}
function addAtom(type) {
    const centerX = canvas.width / 2 + (Math.random() * 40 - 20);
    const centerY = canvas.height / 2 + (Math.random() * 40 - 20);
    return addAtomAt(type, centerX, centerY);
}

// Add Atom via Buttons and Hover Effects
const elementDetails = document.getElementById('element-details');

document.querySelectorAll('.element-btn').forEach(btn => {
    const type = btn.getAttribute('data-type');
    const def = ATOM_DEF[type];
    
    // Set button style dynamically based on element definition
    btn.style.backgroundColor = def.color;
    btn.style.color = def.textColor;
    if (type === 'H') {
        btn.style.border = '1px solid rgba(0,0,0,0.2)';
    } else {
        btn.style.border = '1px solid rgba(255,255,255,0.1)';
        btn.style.boxShadow = `inset -2px -2px 6px rgba(0,0,0,0.3), 0 0 8px ${def.color}40`;
    }

    // Hover effect for details panel
    btn.addEventListener('mouseenter', () => {
        elementDetails.innerHTML = `
            <div class="details-title">
                <span style="display:inline-flex; justify-content:center; align-items:center; width:28px; height:28px; background:${def.color}; color:${def.textColor}; border-radius: 4px; font-size: 1rem; box-shadow: inset -1px -1px 3px rgba(0,0,0,0.4);">${type}</span> 
                ${def.name}
            </div>
            <div class="details-desc">
                최대 결합: ${def.maxBonds}개<br>
                원자량: ${def.mass}
            </div>
        `;
    });

    btn.addEventListener('mouseleave', () => {
        elementDetails.innerHTML = `<div class="element-details-placeholder">주기율표의 원소를<br>호버해보세요!</div>`;
    });
    
    // Drag Start
    const startDragFromPalette = (e) => {
        e.preventDefault();
        const pos = getMousePos(e);
        const newAtom = addAtomAt(type, pos.x, pos.y);
        isDragging = true;
        draggedAtom = newAtom;
        lastMousePos = pos;
    };
    
    btn.addEventListener('mousedown', startDragFromPalette);
    btn.addEventListener('touchstart', startDragFromPalette, { passive: false });
});

const ionToggle = document.getElementById('ion-toggle');
if (ionToggle) {
    ionToggle.addEventListener('change', (e) => {
        const showIons = e.target.checked;
        const table = document.querySelector('.periodic-table');
        if (showIons) {
            table.classList.add('ion-mode');
        } else {
            table.classList.remove('ion-mode');
        }

        document.querySelectorAll('.element-btn').forEach(btn => {
            const type = btn.getAttribute('data-type');
            const def = ATOM_DEF[type];
            btn.innerHTML = `<span>${showIons ? def.ion : type}</span>`;
        });
    });
}

clearBtn.addEventListener('click', () => {
    atoms = [];
    updateMoleculeList();
});

// Interaction
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function onDown(e) {
    const pos = getMousePos(e);
    lastMousePos = pos;
    
    // Find closest atom
    let closest = null;
    let minDist = Infinity;
    for (let atom of atoms) {
        const dx = pos.x - atom.x;
        const dy = pos.y - atom.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < atom.radius * globalScale + 10 && dist < minDist) {
            minDist = dist;
            closest = atom;
        }
    }
    
    if (closest) {
        isDragging = true;
        draggedAtom = closest;
        draggedAtom.vx = 0;
        draggedAtom.vy = 0;
    }
}

function onMove(e) {
    if (!isDragging || !draggedAtom) return;
    const pos = getMousePos(e);
    
    // Absolute position drag to prevent spring stretching
    draggedAtom.x = pos.x;
    draggedAtom.y = pos.y;
    draggedAtom.vx = 0;
    draggedAtom.vy = 0;
    
    lastMousePos = pos;
}

function onUp(e) {
    if (isDragging) {
        // Find if dropped very quickly / forcefully to break bonds?
        // Let's implement double click instead or right click
    }
    isDragging = false;
    draggedAtom = null;
}

// Break bonds on double click
function onDoubleClick(e) {
    const pos = getMousePos(e);
    let broken = false;
    for (let atom of atoms) {
        const dx = pos.x - atom.x;
        const dy = pos.y - atom.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Find if clicked on an atom
        if (dist < atom.radius * globalScale) {
            // Check if it has bonds to break
            if (atom.bonds.length > 0) {
                 // Remove one bond connection from this atom and the corresponding target
                 let targetId = atom.bonds.pop();
                 let targetAtom = atoms.find(a => a.id === targetId);
                 if (targetAtom) {
                     // Find index of this atom's ID in target's bonds and remove one instance
                     let idx = targetAtom.bonds.indexOf(atom.id);
                     if (idx > -1) {
                         targetAtom.bonds.splice(idx, 1);
                     }
                 }
                 
                 // Apply repulsion instantly so they pop apart clearly when a bond breaks
                 if (targetAtom) {
                     let rdx = atom.x - targetAtom.x;
                     let rdy = atom.y - targetAtom.y;
                     let rlen = Math.sqrt(rdx*rdx + rdy*rdy) || 1;
                     atom.vx += (rdx/rlen) * 20; // Increased recoil
                     atom.vy += (rdy/rlen) * 20;
                     targetAtom.vx -= (rdx/rlen) * 20;
                     targetAtom.vy -= (rdy/rlen) * 20;
                     
                     // Add cooldown so they don't immediately re-bond before flying apart!
                     atom.recentlyBonded = 60;
                     targetAtom.recentlyBonded = 60;
                 }
                 
                 broken = true;
            }
            break;
        }
    }
    
    // Check if clicked exactly on a bond line (optional enhancement)
    if (broken) {
        updateMoleculeList();
    }
}

canvas.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
window.addEventListener('touchmove', (e) => { if(isDragging) { e.preventDefault(); onMove(e); } }, { passive: false });
window.addEventListener('touchend', onUp);
canvas.addEventListener('dblclick', onDoubleClick);

// Physics Engine constants
const SPRING_K = 0.05;
const FRICTION = 0.85;
const REPULSION_K = 2.0;
const MAX_SPEED = 20;

function updatePhysics() {
    let moleculeChanged = false;

    // 1. Repulsion and Force Application (No Spring Bonds)
    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            let a1 = atoms[i];
            let a2 = atoms[j];
            
            let dx = a2.x - a1.x;
            let dy = a2.y - a1.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist === 0) {
                dx = Math.random() - 0.5;
                dy = Math.random() - 0.5;
                dist = Math.sqrt(dx*dx + dy*dy);
            }

            const bondCount = a1.bonds.filter(id => id === a2.id).length;
            
            if (bondCount === 0) {
                // Repulsion force
                const minDist = (a1.radius * globalScale + a2.radius * globalScale) + 50 * globalScale;
                if (dist < minDist) {
                    // Try bonding!
                    const canA1Bond = a1.bonds.length < a1.maxBonds;
                    const canA2Bond = a2.bonds.length < a2.maxBonds;
                    
                    if (canA1Bond && canA2Bond && a1.recentlyBonded === 0 && a2.recentlyBonded === 0) {
                        // Create Bond
                        a1.bonds.push(a2.id);
                        a2.bonds.push(a1.id);
                        a1.recentlyBonded = 30; // Small cooldown after single bond
                        a2.recentlyBonded = 30;
                        moleculeChanged = true;
                    } else {
                        // Just repel
                        const force = (minDist - dist) * REPULSION_K;
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;
                        
                        a1.vx -= fx / a1.mass;
                        a1.vy -= fy / a1.mass;
                        a2.vx += fx / a2.mass;
                        a2.vy += fy / a2.mass;
                    }
                }
            } else {
                // Check for bond UPGRADE (Double / Triple bonds)
                // If the user forces an already bonded atom even closer
                const targetDist = (a1.radius * globalScale + a2.radius * globalScale) + 40 * globalScale - ((bondCount - 1) * 10 * globalScale);
                if (bondCount < 3 && dist < targetDist - 25 * globalScale) {
                    const canA1Bond = a1.bonds.length < a1.maxBonds;
                    const canA2Bond = a2.bonds.length < a2.maxBonds;
                    const isDraggingOne = (draggedAtom === a1 || draggedAtom === a2);
                    
                    if (canA1Bond && canA2Bond && a1.recentlyBonded === 0 && a2.recentlyBonded === 0 && isDraggingOne) {
                        a1.bonds.push(a2.id);
                        a2.bonds.push(a1.id);
                        a1.recentlyBonded = 40; 
                        a2.recentlyBonded = 40;
                        moleculeChanged = true;
                    }
                }
            }
        }
    }
    
    // 2. Position & Velocity Update
    atoms.forEach(atom => {
        if (atom !== draggedAtom) {
            atom.x += atom.vx;
            atom.y += atom.vy;
            
            // Friction
            atom.vx *= FRICTION;
            atom.vy *= FRICTION;
            
            // Speed limit
            const speed = Math.sqrt(atom.vx * atom.vx + atom.vy * atom.vy);
            if (speed > MAX_SPEED) {
                atom.vx = (atom.vx / speed) * MAX_SPEED;
                atom.vy = (atom.vy / speed) * MAX_SPEED;
            }
        }
        if (atom.recentlyBonded > 0) atom.recentlyBonded--;
    });

    // 3. Resolve Rigid Constraints (Iterative PBD)
    const iterations = 15; // High iterations for absolute rigidity
    for (let c = 0; c < iterations; c++) {
        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                let a1 = atoms[i];
                let a2 = atoms[j];
                const bondCount = a1.bonds.filter(id => id === a2.id).length;
                if (bondCount > 0) {
                    const targetDist = (a1.radius * globalScale + a2.radius * globalScale) + 40 * globalScale - ((bondCount - 1) * 10 * globalScale); // Guaranteed positive gap
                    
                    let dx = a2.x - a1.x;
                    let dy = a2.y - a1.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist === 0) continue;
                    
                    // Difference between current distance and target rigid distance
                    let diff = (targetDist - dist) / dist;
                    let offsetX = dx * diff * 0.5;
                    let offsetY = dy * diff * 0.5;
                    
                    // Inverse masses for constraints (dragged atom is infinitely massive)
                    let w1 = (a1 === draggedAtom) ? 0 : 1 / a1.mass;
                    let w2 = (a2 === draggedAtom) ? 0 : 1 / a2.mass;
                    let wTotal = w1 + w2;
                    
                    if (wTotal > 0) {
                        let adjust1 = w1 / wTotal;
                        let adjust2 = w2 / wTotal;
                        
                        a1.x -= offsetX * adjust1;
                        a1.y -= offsetY * adjust1;
                        a2.x += offsetX * adjust2;
                        a2.y += offsetY * adjust2;
                    }
                }
            }
        }
        
        // Ensure walls don't break during constraint calculation
        atoms.forEach(atom => {
            const padding = atom.radius * globalScale;
            if (atom.x < padding) { atom.x = padding; if(atom !== draggedAtom) atom.vx *= -0.5; }
            if (atom.x > canvas.width - padding) { atom.x = canvas.width - padding; if(atom !== draggedAtom) atom.vx *= -0.5; }
            if (atom.y < padding) { atom.y = padding; if(atom !== draggedAtom) atom.vy *= -0.5; }
            if (atom.y > canvas.height - padding) { atom.y = canvas.height - padding; if(atom !== draggedAtom) atom.vy *= -0.5; }
        });
    }

    if (moleculeChanged) {
        updateMoleculeList();
    }
}

// Drawing
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Bonds
    ctx.lineWidth = 8;
    let drawnBonds = new Set();
    
    atoms.forEach(atom => {
        // Count frequencies of connections
        let freqMap = new Map();
        atom.bonds.forEach(targetId => {
            freqMap.set(targetId, (freqMap.get(targetId) || 0) + 1);
        });
        
        freqMap.forEach((count, targetId) => {
            let bondKey = [atom.id, targetId].sort().join('-');
            if (drawnBonds.has(bondKey)) return; // Already drawn from the other side
            drawnBonds.add(bondKey);
            
            const target = atoms.find(a => a.id === targetId);
            if (!target) return;
            
            // Check if ionic bond
            const isAtom1Metal = ATOM_DEF[atom.type].isMetal;
            const isTargetMetal = ATOM_DEF[target.type].isMetal;
            const isIonic = (isAtom1Metal && !isTargetMetal) || (!isAtom1Metal && isTargetMetal);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; // Brighter so we see the bonds!
            
            if (isIonic) {
                ctx.setLineDash([12 * globalScale, 8 * globalScale]);
            } else {
                ctx.setLineDash([]);
            }

            // Draw multiple lines for double/triple bonds
            const dx = target.x - atom.x;
            const dy = target.y - atom.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const nx = -dy / len;
            const ny = dx / len;
            
            const spacing = 20 * globalScale; // Enough gap so they don't smear
            ctx.lineWidth = 6 * globalScale; // Thin enough to be distinct lines
            
            if (count === 1) {
                ctx.beginPath();
                ctx.moveTo(atom.x, atom.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
            } else if (count === 2) {
                ctx.beginPath();
                ctx.moveTo(atom.x + nx * spacing/2, atom.y + ny * spacing/2);
                ctx.lineTo(target.x + nx * spacing/2, target.y + ny * spacing/2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(atom.x - nx * spacing/2, atom.y - ny * spacing/2);
                ctx.lineTo(target.x - nx * spacing/2, target.y - ny * spacing/2);
                ctx.stroke();
            } else if (count >= 3) {
                ctx.beginPath();
                ctx.moveTo(atom.x, atom.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(atom.x + nx * spacing, atom.y + ny * spacing);
                ctx.lineTo(target.x + nx * spacing, target.y + ny * spacing);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(atom.x - nx * spacing, atom.y - ny * spacing);
                ctx.lineTo(target.x - nx * spacing, target.y - ny * spacing);
                ctx.stroke();
            }
            
            // Reset dash
            ctx.setLineDash([]);
        });
    });

    // Draw Atoms
    atoms.forEach(atom => {
        // Drop shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 4;
        
        if (atom.type === 'C') {
             // Dark atom, specify stroke to distinguish
             ctx.beginPath();
             ctx.arc(atom.x, atom.y, atom.radius * globalScale, 0, Math.PI * 2);
             ctx.fillStyle = atom.color;
             ctx.fill();
             ctx.lineWidth = 2 * globalScale;
             ctx.strokeStyle = '#57606f';
             ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(atom.x, atom.y, atom.radius * globalScale, 0, Math.PI * 2);
            ctx.fillStyle = atom.color;
            ctx.fill();
        }
        
        ctx.shadowColor = 'transparent'; // reset for text
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw symbol
        ctx.fillStyle = atom.textColor;
        ctx.font = `bold ${atom.radius * globalScale * 0.9}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(atom.symbol, atom.x, atom.y);
        
        // Draw valency rings or dots (free bonds)
        const freeBonds = atom.maxBonds - atom.bonds.length;
        if (freeBonds > 0 && !isDragging) { // don't draw while dragging for visual cleanliness
            ctx.fillStyle = atom.textColor;
            for (let i = 0; i < freeBonds; i++) {
                const angle = (Math.PI * 2 / freeBonds) * i + (Date.now() * 0.001);
                const dotX = atom.x + Math.cos(angle) * (atom.radius * globalScale - 8 * globalScale);
                const dotY = atom.y + Math.sin(angle) * (atom.radius * globalScale - 8 * globalScale);
                
                ctx.beginPath();
                ctx.arc(dotX, dotY, 5 * globalScale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
}

function updateMoleculeList() {
    let visited = new Set();
    let molecules = [];
    
    atoms.forEach(atom => {
        if (!visited.has(atom.id)) {
            let moleculeAtoms = [];
            let stack = [atom];
            visited.add(atom.id);
            
            while (stack.length > 0) {
                let curr = stack.pop();
                moleculeAtoms.push(curr);
                
                curr.bonds.forEach(targetId => {
                    if (!visited.has(targetId)) {
                        visited.add(targetId);
                        let targetNode = atoms.find(a => a.id === targetId);
                        if (targetNode) {
                            stack.push(targetNode);
                        }
                    }
                });
            }
            if (moleculeAtoms.length > 1) {
                molecules.push(moleculeAtoms);
            }
        }
    });

    const listEl = document.getElementById('molecule-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (molecules.length === 0) {
        listEl.innerHTML = '<li class="empty-state">결합된 분자가 없습니다.</li>';
        return;
    }

    
    molecules.forEach(mol => {
        let counts = {};
        let hasMetal = false;
        let hasNonMetal = false;
        
        mol.forEach(a => {
            counts[a.type] = (counts[a.type] || 0) + 1;
            if (ATOM_DEF[a.type].isMetal) {
                hasMetal = true;
            } else {
                hasNonMetal = true; 
            }
        });
        
        let bondType = "";
        if (hasMetal && hasNonMetal) {
            bondType = "<span style='color: #ff9f43; background:rgba(255,159,67,0.1); padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;'>이온결합</span>";
        } else if (!hasMetal && hasNonMetal) {
            bondType = "<span style='color: #1dd1a1; background:rgba(29,209,161,0.1); padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;'>공유결합</span>";
        } else if (hasMetal && !hasNonMetal) {
            bondType = "<span style='color: #feca57; background:rgba(254,202,87,0.1); padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;'>금속결합</span>";
        }
        
        let formula = "";
        let elements = Object.keys(counts);
        
        const FORMULA_ORDER = ['K', 'Ca', 'Na', 'Mg', 'Al', 'Li', 'Be', 'B', 'Si', 'C', 'P', 'N', 'H', 'S', 'O', 'Cl', 'F', 'He', 'Ne', 'Ar'];
        
        elements.sort((a, b) => {
            let idxA = FORMULA_ORDER.indexOf(a);
            let idxB = FORMULA_ORDER.indexOf(b);
            if (idxA === -1) idxA = 999;
            if (idxB === -1) idxB = 999;
            return idxA - idxB;
        });
        
        elements.forEach(el => {
            formula += el;
            if (counts[el] > 1) {
                formula += `<sub>${counts[el]}</sub>`;
            }
        });
        
        let li = document.createElement('li');
        let atomIdsStr = mol.map(a => a.id).join(',');
        
        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="formula">${formula}</span> ${bondType}
            </div>
            <button class="delete-mol-btn" data-ids="${atomIdsStr}" style="background:none; border:none; color:#ff4757; font-size:1.2rem; cursor:pointer;" title="분자 삭제">✖</button>
        `;
        
        const deleteBtn = li.querySelector('.delete-mol-btn');
        deleteBtn.addEventListener('click', () => {
            const idsToRemove = deleteBtn.getAttribute('data-ids').split(',').map(Number);
            atoms = atoms.filter(a => !idsToRemove.includes(a.id));
            
            // 만약 다른 원소의 결합 배열에 삭제된 원소 ID가 남아있다면 정리
            atoms.forEach(a => {
                a.bonds = a.bonds.filter(bId => !idsToRemove.includes(bId));
            });
            
            updateMoleculeList();
        });
        
        listEl.appendChild(li);
    });
}

function loop() {
    updatePhysics();
    draw();
    requestAnimationFrame(loop);
}

// Instruction hints
ctx.font = '20px Inter';
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.textAlign = 'center';
ctx.fillText('왼쪽에서 원소를 추가해보세요.', canvas.width/2, canvas.height/2);

setTimeout(loop, 500); // Start after font load delay
