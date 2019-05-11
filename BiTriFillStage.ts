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
