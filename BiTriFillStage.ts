const w : number = window.innerWidth
const h : number = window.innerHeight
const nodes : number = 5
const triangles : number = 2
const scGap : number = 0.05
const scDiv : number = 0.51
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const foreColor : string = "#673AB7"
const backColor : string = "#BDBDBD"

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
    }

    static scaleFactor(scale : number) : number {
        return Math.floor(scale / scDiv)
    }

    static mirrorValue(scale : number, a : number, b : number) : number {
        const k : number = ScaleUtil.scaleFactor(scale)
        return (1 - k) / a + k / b
    }

    static updateValue(scale : number, dir : number, a : number, b : number) : number {
        return ScaleUtil.mirrorValue(scale, a, b) * dir * scGap
    }
}

class DrawingUtil {

      static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number, clip : boolean) {
          context.beginPath()
          context.moveTo(x1, y1)
          context.lineTo(x2, y2)
          if (!clip) {
              context.stroke()
          } else {
              context.clip()
          }
      }

      static drawTriangle(context : CanvasRenderingContext2D, size : number, clip : boolean) {
          DrawingUtil.drawLine(context, 0, 0, -size / 2, -size / 2, clip)
          DrawingUtil.drawLine(context, -size / 2, -size / 2, size / 2, -size / 2, clip)
          DrawingUtil.drawLine(context, size / 2, -size / 2, 0, 0, clip)
      }

      static drawFillRect(context : CanvasRenderingContext2D, size : number, sc : number) {
          context.fillRect(-size / 2, -size / 2 * sc, size, size / 2 * sc)
      }

      static drawFillTriangle(context : CanvasRenderingContext2D, sc : number, size : number) {
          const x : number = -size * 0.75
          context.save()
          DrawingUtil.drawLine(context, 0, 0, x, 0, false)
          context.translate(x, 0)
          DrawingUtil.drawTriangle(context, size, false)
          context.save()
          DrawingUtil.drawTriangle(context, size, true)
          DrawingUtil.drawFillRect(context, size, sc)
          context.restore()
          context.restore()
      }

      static drawBTFNode(context : CanvasRenderingContext2D, i : number, scale : number) {
          const w : number = window.innerWidth
          const h : number = window.innerHeight
          const gap : number = h / (nodes + 1)
          const size : number = gap / sizeFactor
          const sc1 : number = ScaleUtil.divideScale(scale, 0, 2)
          const sc2 : number = ScaleUtil.divideScale(scale, 1, 2)
          context.lineCap = 'round'
          context.lineWidth = Math.min(w, h) / strokeFactor
          context.strokeStyle = foreColor
          context.save()
          context.translate(w / 2, gap * (i + 1))
          context.rotate(Math.PI / 2 * sc2)
          for (var j = 0; j < triangles; j++) {
              context.save()
              context.scale(1 - 2 * j, 1)
              DrawingUtil.drawFillTriangle(context, ScaleUtil.divideScale(sc1, j, triangles), size)
              context.restore()
          }
          context.restore()
      }
}

class BiTriFillStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = foreColor
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : BiTriFillStage = new BiTriFillStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += ScaleUtil.updateValue(this.scale, this.dir, triangles, 1)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class BTFNode {

    state : State = new State()
    prev : BTFNode
    next : BTFNode

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new BTFNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawBTFNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : BTFNode {
        var curr : BTFNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class BiTriFill {

    root : BTFNode = new BTFNode(0)
    curr : BTFNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    animator : Animator = new Animator()
    btf : BiTriFill = new BiTriFill()

    render(context : CanvasRenderingContext2D) {
        this.btf.draw(context)
    }

    handleTap(cb : Function) {
        this.btf.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.btf.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
