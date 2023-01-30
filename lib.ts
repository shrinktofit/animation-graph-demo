
export interface Graph {
    rootOutput: Node<unknown>;
}

export abstract class Node<T> {
    constructor(outputCount: number) {
        this.outputs = Array.from({ length: outputCount }, () => ({ value: undefined as unknown as T }));
    }

    __bindings: Map<string, NodePropertyBinding<unknown>> = new Map();

    public evaluate() {
        // Fetch inputs.
        for (const [propertyKey, binding] of this.__bindings) {
            // @ts-expect-error
            this[propertyKey] = binding.get();
        }

        this.selfEvaluate(this.outputs);
    }

    public getOutput(outputIndex: number) {
        return this.outputs[outputIndex].value;
    }

    public outputs: readonly NodeOutput<T>[];

    protected abstract selfEvaluate(outputs: readonly NodeOutput<T>[]): void;

    protected setOutput(outputIndex: number, value: T) {
        this.outputs[outputIndex].value = value;
    }
}

export abstract class SingleOutputNode<T> extends Node<T> {
    constructor() {
        super(1);
    }

    protected abstract evaluateDefaultOutput(): T;

    protected selfEvaluate(outputs: readonly NodeOutput<T>[]): void {
        outputs[0].value = this.evaluateDefaultOutput();
    }
}

interface NodeOutput<T> {
    value: T;
}

class NodePropertyBinding<T> {
    constructor(target: Node<T>, outputIndex: number) {
        this._target = target;
        this._outputIndex = outputIndex;
    }

    public get __target() {
        return this._target;
    }

    private _target: Node<T>;
    private _outputIndex: number;

    get() {
        return this._target.getOutput(this._outputIndex);
    }
}

/** Unused. */
export function bindable(): PropertyDecorator {
    return (target: Object, propertyKey: PropertyKey) => {
        if (typeof propertyKey !== 'string') {
            throw new Error(`Only string keys are allowed.`);
        }
    };
}

export function bind<T extends Node<any>>(object: T, propertyKey: keyof T, node: T extends Node<infer U> ? Node<U> : never, outputIndex: number = 0) {
    if (typeof propertyKey !== 'string') {
        throw new Error(`Only string keys are allowed.`);
    }
    object.__bindings.set(propertyKey, new NodePropertyBinding(node, outputIndex));
}

export function evaluate(graph: Graph) {
    // Key: node; Value: max depth
    const depthMap = new Map<Node<unknown>, number>();
    const enqueue = (node: Node<unknown>, depth: number) => {
        if (!depthMap.has(node)) {
            depthMap.set(node, depth);
        } else {
            const maxDepth = depthMap.get(node)!;
            if (depth < maxDepth) {
                return; // Stop recurse.
            } else {
                // Update max depth recurse.
                depthMap.set(node, depth);
            }
        }

        for (const [_, binding] of node.__bindings) {
            enqueue(binding.__target, depth + 1);
        }
    };
    enqueue(graph.rootOutput, 0);

    const queue = [...depthMap];
    queue.sort(([_1, a], [_2, b]) => b - a);

    for (const [node] of queue) {
        node.evaluate();
    }

    return graph.rootOutput.getOutput(0);
}