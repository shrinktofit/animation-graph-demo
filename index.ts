import { bind, bindable, evaluate, Graph, SingleOutputNode } from "./lib";

class GetVar extends SingleOutputNode<number> {
    public value = 0.0;

    public evaluateDefaultOutput(): number {
        return this.value;
    }
}

class Cosine extends SingleOutputNode<number> {
    @bindable()
    public operand = 0.0;

    public evaluateDefaultOutput() {
        return Math.cos(this.operand);
    }
}

class Sine extends SingleOutputNode<number> {
    @bindable()
    public operand = 0.0;

    public evaluateDefaultOutput(): number {
        return Math.sin(this.operand);
    }
}

class Add extends SingleOutputNode<number> {
    @bindable()
    public lhs = 0.0;

    @bindable()
    public rhs = 0.0;

    public evaluateDefaultOutput(): number {
        return this.lhs + this.rhs;
    }
}

class Mul extends SingleOutputNode<number> {
    @bindable()
    public lhs = 0.0;

    @bindable()
    public rhs = 0.0;

    public evaluateDefaultOutput(): number {
        return this.lhs * this.rhs;
    }
}

function makeDemo(): { graph: Graph, expected: () => void } {
    const COS_OP = 30 / 180.0 * Math.PI;
    const VAR_VALUE = 45.0 / 180.0 * Math.PI;

    const getVar = new GetVar();
    getVar.value = VAR_VALUE;
    const cos = new Cosine();
    cos.operand = COS_OP;
    const sin = new Sine();
    const add = new Add();
    const mul = new Mul();

    bind(sin, 'operand', getVar);

    bind(add, 'lhs', cos);
    bind(add, 'rhs', sin);

    bind(mul, 'lhs', add);
    bind(mul, 'rhs', sin);

    return {
        graph: {
            rootOutput: mul,
        },
        expected: () => {
            return (Math.sin(VAR_VALUE) + Math.cos(COS_OP)) * (Math.sin(VAR_VALUE));
        },
    };
}

function main() {
    const { graph, expected } = makeDemo();
    const graphOutput = evaluate(graph);

    console.log(
        graphOutput,
        expected(),
    );
}

main();

export {};