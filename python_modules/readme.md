# 请求eb4生成答案

1. 请求eb4
    - 代码：python wenxin_api_cs_answer.py <输入文件> <输出文件>
    - 如：python wenxin_api_cs_answer.py data_input.txt data_output
    - 输入文件每行是一个问题
    - 输出文件每行是一言4对这个问题返回的结果。
    - wenxin_api_cs_answer.py 用gbk编码，可以修改prompt，看怎么写prompt 效果好 就怎么来
2. 解析eb4返回的结果，方便人类观看
    - 代码：python3 parse_eb4_result.py <输入文件> <输出文件>
    - 如：python3 parse_eb4_result.py data_output_aigc_text_wenxinyiyan4 data_parsed.txt
    - 输入文件就是刚才eb4返回的结果
