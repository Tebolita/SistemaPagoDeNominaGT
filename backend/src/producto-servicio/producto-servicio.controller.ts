import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ProductoServicioService } from './producto-servicio.service';
import { CreateProductoServicioDto, UpdateProductoServicioDto } from './dto/producto-servicio.dto';

@Controller('producto-servicio')
export class ProductoServicioController {
  constructor(private readonly productoServicioService: ProductoServicioService) {}

  @Post()
  create(@Body() createProductoServicioDto: CreateProductoServicioDto) {
    return this.productoServicioService.create(createProductoServicioDto);
  }

  @Get()
  findAll(
    @Query('activo') activo?: string,
    @Query('tipo') tipo?: string,
  ) {
    const activoFilter = activo === 'true' ? true : activo === 'false' ? false : undefined;
    return this.productoServicioService.findAll(activoFilter, tipo);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productoServicioService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProductoServicioDto: UpdateProductoServicioDto) {
    return this.productoServicioService.update(id, updateProductoServicioDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productoServicioService.remove(id);
  }
}